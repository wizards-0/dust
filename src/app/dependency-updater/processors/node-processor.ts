import { List, Map } from "immutable";
import { DateTime } from "luxon";
import { from, map, mergeAll, Observable, of, reduce } from "rxjs";
import { Dependency } from "../model/dependency";
import { Version } from "../model/version";
import { getVersionWithRelativeDownloads, matchVersion } from "../dependency-updater.component";
import { Injectable } from "@angular/core";
import { ApiService } from "../../api-service/api.service";
import { SettingsService } from "../../settings/settings.service";

@Injectable({
  providedIn: 'root',
})
export class NodeProcessor {

  packageJson: any = {};

  private readonly versionDownloadsComparator = (v1: Version, v2: Version) => ((v2.downloads) - (v1.downloads));

  constructor(private readonly apiService: ApiService,private readonly settingsService:SettingsService) { }


  public processPackageJson(packageJson: string) {
    try {
      this.packageJson = JSON.parse(packageJson);
    } catch (err) {
      throw new Error('Invalid Json');
    }


    const dependencies = Map(this.packageJson['dependencies']);
    const devDependencies = Map(this.packageJson['devDependencies']);
    let dependencyList = this.parseDependencies(dependencies);
    let devDependencyList = this.parseDependencies(devDependencies);

    return {
      dependencyList$: this.fetchVersions(dependencyList),
      devDependencyList$: this.fetchVersions(devDependencyList)
    }
  }

  parseDependencies(dependencies: Map<any, any>): List<Dependency> {
    return List(dependencies.entrySeq().filter(e => e[0]).map(entry => {
      let name = entry[0] as string;
      let currentVersion = entry[1];

      return Dependency.fromRaw({
        name: name,
        currentVersion: currentVersion
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
    return this.apiService.getNodePackageDownloadInfo(dep.name)
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
    return this.apiService.getNodePackageInfo(dep.name)
      .pipe(map((packageInfo: any) => {
        let distTags = this.mapTagsToVersion(packageInfo['dist-tags']);
        let publishInfo = Map(packageInfo['time']);
        let top10Downloads = dep.versions
          .filter(ver => !this.settingsService.isVersionBlacklisted(ver.version))
          .sort(this.versionDownloadsComparator).slice(0, 10);
        let latestVersionString = packageInfo['dist-tags']['latest'];
        let lastUpdatedVersion = (publishInfo.entrySeq()
        .filter( (e:any) => !this.settingsService.isVersionBlacklisted(e[0]))
        .max( (e1:any,e2:any) => DateTime.fromISO(e1[1]).toMillis() - DateTime.fromISO(e2[1]).toMillis()) as any)[0];
        let top10VersionsWithLatestTag = this.withLatestVersions(top10Downloads, latestVersionString,lastUpdatedVersion, dep.versions)
          .map(ver => ver.with(builder => {
            builder.tag(distTags.get(ver.version, ''));
            let publishDate = publishInfo.get(ver['version']) as string;
            if(publishDate){
              builder.publishDate(DateTime.fromISO(publishDate).toMillis())
            }
          }));
        let maxDownloads = top10VersionsWithLatestTag.maxBy(ver => ver.downloads)?.downloads;
        let top10VersionsWithLatestTagAndRelativeDownloads = top10VersionsWithLatestTag.map(ver => getVersionWithRelativeDownloads(ver, maxDownloads))
        let relevantVersions = top10VersionsWithLatestTagAndRelativeDownloads.sort((v1, v2) => v2.publishDate - v1.publishDate).slice(0, 10);
        return dep.toBuilder()
          .isLatest(matchVersion(dep,relevantVersions.get(0,Version.empty())))
          .versions(relevantVersions).build();
      }));
  }

  public getUpdatedPackageJson(dependencyList: List<Dependency>, devDependencyList: List<Dependency>): string {

    const dependencies = this.transfromDependencyListToMap(dependencyList);
    const devDependencies = this.transfromDependencyListToMap(devDependencyList);

    this.packageJson['dependencies'] = dependencies;
    this.packageJson['devDependencies'] = devDependencies;
    return JSON.stringify(this.packageJson,null,2);
  }

  transfromDependencyListToMap(dependencyList: List<Dependency>) {
    let depsMap:any = {};
    dependencyList.forEach(dep => depsMap[dep.name] = dep.updateVersion ? dep.updateVersion : dep.currentVersion);
    return depsMap;
  }

  withLatestVersions(top10Downloads: List<Version>, latestVersionString: string | undefined, lastUpdatedVersionString: string, allDownloads: List<Version>): List<Version> {
    let result = top10Downloads;
    let missingLatestTagVersion = true;
    let missingLastUpdatedVersion = true;
    if(latestVersionString == lastUpdatedVersionString) missingLastUpdatedVersion = false;
    for(let ver of top10Downloads) {
      if(ver.version == latestVersionString) missingLatestTagVersion = false;
      if(ver.version == lastUpdatedVersionString) missingLastUpdatedVersion = false;
    }

    if(latestVersionString && missingLatestTagVersion && !this.settingsService.isVersionBlacklisted(latestVersionString)) {
      result = result.push(Version.builder()
      .version(latestVersionString)
      .downloads((allDownloads.find(v => v.version == latestVersionString) ?? Version.empty()).downloads)
      .build())
    }

    if(missingLastUpdatedVersion) {
      result = result.push(Version.builder()
      .version(lastUpdatedVersionString)
      .downloads((allDownloads.find(v => v.version == lastUpdatedVersionString) ?? Version.empty()).downloads)
      .build())
    }

    return result;
  }

  mapTagsToVersion(distTags: any): Map<string, string> {
    let accumulator: {[key: string]: string} = {};
    for (let tag in distTags) {
      let version: string = distTags[tag];
      if (accumulator.hasOwnProperty(version)) {
        accumulator[version] = accumulator[version] + ', ' + tag;
      } else {
        accumulator[version] = tag;
      }
    }
    return Map(accumulator).toMap() as Map<string, string>;
  }
}
