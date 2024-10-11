import { HttpClient } from "@angular/common/http";
import { List, Map } from "immutable";
import { DateTime } from "luxon";
import { from, map, mergeAll, Observable, of, reduce } from "rxjs";
import { Dependency } from "../model/dependency";
import { Version } from "../model/version";
import { getVersionWithRelativeDownloads } from "../dependency-updater.component";
import { Api } from "../../app.config";

export class NodeProcessor {

  packageJson: any = {};

  private readonly versionDownloadsComparator = (v1: Version, v2: Version) => ((v2.downloads) - (v1.downloads));

  constructor(private httpClient: HttpClient) { }


  public processPackageJson(packageJson: string) {
    try {
      this.packageJson = JSON.parse(packageJson);
    } catch (err) {
      throw new Error('Invalid Json');
    }


    const dependencies = Map(this.packageJson['dependencies']);
    const devDependencies = Map(this.packageJson['devDependencies']);
    const dependencyUpdatedOn: Map<string, number> = Map(this.packageJson.hasOwnProperty('dependencyUpdatedOn') ? this.packageJson['dependencyUpdatedOn'] : {});

    let dependencyList = this.parseDependencies(dependencies, dependencyUpdatedOn);
    let devDependencyList = this.parseDependencies(devDependencies, dependencyUpdatedOn);

    return {
      dependencyList$: this.fetchVersions(dependencyList),
      devDependencyList$: this.fetchVersions(devDependencyList)
    }
  }

  parseDependencies(dependencies: Map<any, any>, dependencyUpdatedOn: Map<string, number>): List<Dependency> {
    return List(dependencies.entrySeq().map(entry => {
      let name = entry[0] as string;
      let currentVersion = entry[1];
      let updateVersion;
      let isUpToDate;
      let lastUpdatedDate = DateTime.fromMillis(dependencyUpdatedOn.get(name, 0));
      //TODO: make 30 configurable
      let diffInDays = DateTime.now().startOf('day').diff(lastUpdatedDate.startOf('day')).as('days');

      if (diffInDays <= 30) {
        updateVersion = currentVersion;
        isUpToDate = true;
      } else {
        updateVersion = undefined;
        isUpToDate = false;
      }

      return Dependency.fromRaw({
        name: name,
        currentVersion: currentVersion,
        updateVersion: updateVersion,
        isUpToDate: isUpToDate,
        updatedOn: lastUpdatedDate.toMillis()
      });

    }));
  }

  fetchVersions(dependencies: List<Dependency>): Observable<List<Dependency>> {

    let dependencyDownloadInfoResp = dependencies.map(dep => this.fetchDownloadDetails(dep));

    let accumulatedDownloadInfoResp = from(dependencyDownloadInfoResp).pipe(mergeAll()).pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])));

    let dependencyVersionInfoResp = accumulatedDownloadInfoResp.pipe(map(deps =>
      deps.map(dep => dep.versions.size > 0
        ? this.fetchVersionDetails(dep)
        : of(dep))
    ));

    let accumulatedVersionInfoResp = dependencyVersionInfoResp
      .pipe(map(verInfo => from(verInfo)
        .pipe(mergeAll())
        .pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])))
      )).pipe(mergeAll())
      .pipe(map(deps => deps.sortBy(dep => dep.name)));

    return accumulatedVersionInfoResp;
  }

  fetchDownloadDetails(dep: Dependency) {
    let downloadInfoUrl = Api.NodeDownload.replace('${packageName}', encodeURIComponent(dep.name))
    return this.httpClient.get(downloadInfoUrl)
      .pipe(map((downloadInfo: any) => {
        let versions = Map(downloadInfo['downloads']);
        let versionDownloads = versions.entrySeq().map(entry =>
          Version.fromRaw({
            version: entry[0],
            downloads: entry[1]
          })
        );
        return dep.toBuilder().versions(List(versionDownloads)).build();
      }));
  }

  fetchVersionDetails(dep: Dependency) {
    let packageInfoUrl = Api.NodePackage.replace('${packageName}', encodeURIComponent(dep.name));
    return this.httpClient.get(packageInfoUrl)
      .pipe(map((packageInfo: any) => {
        let distTags = this.mapTagsToVersion(packageInfo['dist-tags']);
        let publishInfo = Map(packageInfo['time']);
        let top10Downloads = dep.versions.sort(this.versionDownloadsComparator).slice(0, 10);
        let latestVersionString = packageInfo['dist-tags']['latest'];
        let top10VersionsWithLatestTag = this.withLatestVersion(top10Downloads, latestVersionString, dep.versions)
          .map(ver => ver.with(builder => {
            builder.tag(distTags.get(ver.version, '') as string);
            let publishDate = publishInfo.get(ver['version']) as string;
            if(publishDate){
              builder.publishDate(DateTime.fromISO(publishDate).toMillis())
            }
          }));

        let maxDownloads = top10VersionsWithLatestTag.maxBy(ver => ver.downloads)?.downloads;
        let top10VersionsWithLatestTagAndRelativeDownloads = top10VersionsWithLatestTag.map(ver => getVersionWithRelativeDownloads(ver, maxDownloads))

        return dep.toBuilder().versions(top10VersionsWithLatestTagAndRelativeDownloads.sort((v1, v2) => v2.publishDate - v1.publishDate)).build();
      }));
  }

  public getUpdatedPackageJson(dependencyList: List<Dependency>, devDependencyList: List<Dependency>): string {

    const dependencies = this.transfromDependencyListToMap(dependencyList);
    const devDependencies = this.transfromDependencyListToMap(devDependencyList);

    const dependencyUpdatedOn = Map(dependencyList.concat(devDependencyList).map(dep => {
      return [
        dep.name,
        dep.updatedOn
      ]
    }));

    this.packageJson['dependencies'] = dependencies;
    this.packageJson['devDependencies'] = devDependencies;
    this.packageJson['dependencyUpdatedOn'] = dependencyUpdatedOn;
    return JSON.stringify(this.packageJson);
  }

  transfromDependencyListToMap(dependencyList: List<Dependency>) {

    return Map(dependencyList.map(dep => {
      return [
        dep.name,
        dep.updateVersion ? dep.updateVersion : dep.currentVersion
      ]
    }));
  }

  withLatestVersion(top10Downloads: List<Version>, latestVersionString: string, allDownloads: List<Version>): List<Version> {
    let top10VersionsWithLatestTag;
    if (latestVersionString && !top10Downloads.find(ver => ver.version == latestVersionString)) {
      let latestVersion = Version.builder()
        .version(latestVersionString)
        .downloads((allDownloads.find(v => v.version == latestVersionString) ?? Version.empty()).downloads)
        .build();
      top10VersionsWithLatestTag = top10Downloads.push(latestVersion);
    } else {
      top10VersionsWithLatestTag = top10Downloads;
    }

    return top10VersionsWithLatestTag;
  }

  mapTagsToVersion(distTags: any): Map<string, string> {
    let accumulator: any = {};
    for (let tag in distTags) {
      let version: string = distTags[tag];
      if (accumulator.hasOwnProperty(version)) {
        accumulator[version] = accumulator[version] + ', ' + tag;
      } else {
        accumulator[version] = tag;
      }
    }
    return Map(accumulator);
  }
}
