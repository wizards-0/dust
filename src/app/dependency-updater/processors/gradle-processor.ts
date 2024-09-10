import { HttpClient } from "@angular/common/http";
import { List, Map } from "immutable";
import { Dependency } from "../model/dependency";
import { Version } from "../model/version";
import { catchError, delay, from, map, mergeAll, Observable, of, reduce, retry } from "rxjs";
import { getVersionWithRelativeDownloads } from "../dependency-updater.component";
import { DateTime } from "luxon";
import { Api } from "../../app.config";

export class GradleProcessor {
    private fileParts:any = {};

    constructor(private httpClient: HttpClient) { }

    processBuildGradle(buildGradle: string) {
        let lines = buildGradle.replaceAll('\'', '"').split('\n');

        this.fileParts = this.getBuildFileParts(lines);

        let jsonPart = (this.fileParts.dependencyUpdatedOnLines as List<string>).slice(1, -1).join('\n');
        let dependencyUpdatedOnJson = '{' + jsonPart.substring(0, jsonPart.length - 1) + '}';
        let dependencyUpdatedOn = JSON.parse(dependencyUpdatedOnJson);

        const dependencies = this.parseDependencyLines(this.fileParts.dependencyLines, dependencyUpdatedOn);
        const pluginDependencies = this.parsePluginLines(this.fileParts.pluginLines,dependencyUpdatedOn);

        return {
            dependencyList$: this.fetchVersions(dependencies),
            pluginDependencyList$: this.fetchPluginVersions(pluginDependencies)
        }
    }

    private fetchVersions(dependencies: List<Dependency>): Observable<List<Dependency>> {
        let versionInfoResp = dependencies.map(dep => {            
            let nameParts = dep.name.split(':');
            let group = nameParts[0];
            let artifact = nameParts[1]
            let url = Api.MavenDependency
                .replace('${group}',encodeURIComponent(group))
                .replace('${artifact}',encodeURIComponent(artifact));
            return this.httpClient.get(url).pipe(map((resp: any) => {

                let versions = List(resp.components as any[]).map(component => {
                    let ossIndexInfo = component['ossIndexInfo'];
                    let vulnerabilityCount = ossIndexInfo['vulnerabilityCount'] ? ossIndexInfo['vulnerabilityCount'] : 0;

                    return Version.builder()
                        .version(component['version'])
                        .downloads(component['dependencyOfCount'])
                        .vulnerabilityCount(vulnerabilityCount)
                        .publishDate(component['publishedEpochMillis'])
                        .build()
                })
                let maxDownloads = versions.maxBy(ver => ver.downloads)?.downloads;

                return dep.toBuilder()
                    .versions(versions.map(ver => getVersionWithRelativeDownloads(ver, maxDownloads)))
                    .build();

            }));
        });

        return from(versionInfoResp).pipe(mergeAll()).pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])));
    }

    private fetchPluginVersions(dependencies: List<Dependency>): Observable<List<Dependency>> {
        const versionExtractor = (line:string) => {
            let versionMatch = RegExp(/<version>(.*)<\/version>/).exec(line);
            return versionMatch ? versionMatch[1] : '';
        };
        let versionInfoResp = dependencies.map(dep => {
            let pluginMetadataUrl = Api.GradlePlugin.replace('${pluginPath}',`${dep.name.replaceAll('.', '/')}/${dep.name}.gradle.plugin`)            
            let proxyUrl = Api.Proxy.replace('${originalUrl}',encodeURIComponent(pluginMetadataUrl));
            return this.httpClient.get(proxyUrl, { responseType: "text" })
            .pipe(retry({count:5,delay:1000}))
            .pipe(map((resp: string) => {

                let versionMatches = resp.match(/<version>(.*?)<\/version>/g);
                let dateMatch = RegExp(/<lastUpdated>(.*)<\/lastUpdated>/).exec(resp);
                let lastUpdated = DateTime.fromFormat(dateMatch ? dateMatch[1] : '19700101120000', 'yyyyLLddHHmmss');

                let versions = List(versionMatches ? versionMatches : [])
                    .map(versionExtractor)
                    .filter(line => line)
                    .reverse()
                    .slice(0, 10)
                    .map(ver => Version.builder().version(ver).build());

                let versionsWithLastUpdated = versions.set(0, versions.get(0,Version.empty()).toBuilder()
                    .publishDate(lastUpdated.toMillis())
                    .build());

                return dep.toBuilder()
                    .versions(versionsWithLastUpdated)
                    .build();
            }),catchError(err=>of(dep)));
        });

        return from(versionInfoResp).pipe(mergeAll()).pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])));
    }

    private getBuildFileParts(lines: string[]) {
        let initialValue = {
            currentSectionIndex: 0,
            braceCount: 0,
            prePluginLines: List<string>([]),
            pluginLines: List<string>([]),
            betweenPluginAndDependencyLines: List<string>([]),
            dependencyLines: List<string>([]),
            postDependencyLines: List<string>([]),
            dependencyUpdatedOnLines: List<string>([])
        }

        let fileParts = lines.reduce((acc:any, line:string) => {
            let braceCount: number;
            let sectionIndex: number;

            if (line.trim().endsWith('{')) {
                braceCount = acc.braceCount + 1;
            } else if (line.trim().endsWith('}')) {
                braceCount = acc.braceCount - 1;
            } else {
                braceCount = acc.braceCount;
            }

            let fileParts = List([
                acc.prePluginLines,
                acc.pluginLines,
                acc.betweenPluginAndDependencyLines,
                acc.dependencyLines,
                acc.postDependencyLines,
                acc.dependencyUpdatedOnLines
            ]);

            let updatedFileParts;

            if (line.includes('plugins')
                || line.includes('dependencies')
                || line.includes('dependencyResolutionManagement')
                || line.includes('dependencyUpdatedOn')
            ) {
                sectionIndex = acc.currentSectionIndex + 1;
                updatedFileParts = fileParts.set(sectionIndex, fileParts.get(sectionIndex).push(line));
            } else if ((acc.currentSectionIndex == 1 || acc.currentSectionIndex == 3) && braceCount == 0) {
                updatedFileParts = fileParts.set(acc.currentSectionIndex, fileParts.get(acc.currentSectionIndex).push(line));
                sectionIndex = acc.currentSectionIndex + 1;
            } else {
                sectionIndex = acc.currentSectionIndex;
                updatedFileParts = fileParts.set(sectionIndex, fileParts.get(sectionIndex).push(line));
            }

            return {
                currentSectionIndex: sectionIndex,
                braceCount: braceCount,
                prePluginLines: updatedFileParts.get(0),
                pluginLines: updatedFileParts.get(1),
                betweenPluginAndDependencyLines: updatedFileParts.get(2),
                dependencyLines: updatedFileParts.get(3),
                postDependencyLines: updatedFileParts.get(4),
                dependencyUpdatedOnLines: updatedFileParts.get(5)
            };
        }, initialValue);

        return {
            prePluginLines: fileParts.prePluginLines,
            pluginLines: fileParts.pluginLines,
            betweenPluginAndDependencyLines: fileParts.betweenPluginAndDependencyLines,
            dependencyLines: fileParts.dependencyLines,
            postDependencyLines: fileParts.postDependencyLines,
            dependencyUpdatedOnLines: fileParts.dependencyUpdatedOnLines
        };
    }


    private parsePluginLines(pluginLines: string[], dependencyUpdatedOn: any) {
        const dependencies = List(pluginLines).map(line => {
            let matches = RegExp(/.*"(.*?)".*?"(.*?)".*/).exec(line);

            if (matches) {
                let pluginName = matches[1];
                let currentVersion = matches[2];
                return this.createDependency(pluginName,currentVersion,dependencyUpdatedOn);
            } else {
                return null;
            }
        }).filter(item => item != null);

        return dependencies;
    }

    private parseDependencyLines(dependencyLines: string[], dependencyUpdatedOn: any) {
        const dependencies = List(dependencyLines).map(line => {
            let matches = RegExp(/.*"(.*?:.*?:.*?)".*/).exec(line);
            if (matches) {
                let dependency = matches[1];
                let dependencyParts = dependency.split(':');
                let name = dependencyParts[0] + ':' + dependencyParts[1];
                let currentVersion = dependencyParts[2];
                return this.createDependency(name,currentVersion,dependencyUpdatedOn);
            } else {
                return null;
            }
        }).filter(item => item != null);

        return dependencies;
    }

    getUpdatedGradleFile(dependencyList: List<Dependency>, pluginDependencyList: List<Dependency>) {

        let pluginVersionMap = Map(pluginDependencyList.map(dep => [
            dep.name,
            dep.updateVersion ? dep.updateVersion : dep.currentVersion
        ]));
        let updatedPluginLines = this.fileParts.pluginLines.map( (line:string) => {
            let matches = RegExp(/(.*")(.*?)(".*?")(.*?)(".*)/).exec(line);
            if (matches) {
                let updatedPluginVersion = pluginVersionMap.get(matches[2], matches[4]);
                let updatedLine = matches[1] + matches[2] + matches[3] + updatedPluginVersion + matches[5];
                return updatedLine;
            } else {
                return line;
            }
        });

        let dependencyVersionMap = Map(dependencyList.map(dep => [
            dep.name,
            dep.updateVersion ? dep.updateVersion : dep.currentVersion
        ]));

        let dependencyLines = this.fileParts.dependencyLines.map( (line:string) => {
            let matches = RegExp(/(.*")(.*?:.*?:.*?)(".*)/).exec(line);
            if (matches) {
                let dependency = matches[2];
                let dependencyParts = dependency.split(':');
                let name = dependencyParts[0] + ':' + dependencyParts[1];
                let updatedDependencyVersion = dependencyVersionMap.get(name);
                let updatedLine = matches[1] + name + ':' + updatedDependencyVersion + matches[3];
                return updatedLine;
            } else {
                return line;
            }
        });

        

        let dependencyUpdatedOnLines = List<string>([])
            .push('/* dependencyUpdatedOn {')
            .concat(dependencyList.concat(pluginDependencyList).map(dep => `"${dep.name}":${dep.updatedOn},`))
            .push('} */')

        let updatedLines = this.fileParts.prePluginLines
            .concat(updatedPluginLines)
            .concat(this.fileParts.betweenPluginAndDependencyLines)
            .concat(dependencyLines)
            .concat(this.fileParts.postDependencyLines)
            .concat(dependencyUpdatedOnLines);

        return (updatedLines as List<string>).join('\n');
    }

    private createDependency(name: string, currentVersion: string, dependencyUpdatedOn: any): Dependency {
        let updatedOn: number;
        let updateVersion: string;
        let isUpToDate: boolean;
        if (dependencyUpdatedOn.hasOwnProperty(name)) {
            updatedOn = dependencyUpdatedOn[name];
        } else {
            updatedOn = 0;
        }

        //TODO: make 30 configurable
        if (DateTime.now().diff(DateTime.fromMillis(updatedOn)).as('days') <= 30) {
            updateVersion = currentVersion;
            isUpToDate = true;
        } else {
            updateVersion = '';
            isUpToDate = false;
        }
        return Dependency.builder()
            .name(name)
            .currentVersion(currentVersion)
            .updateVersion(updateVersion)
            .updatedOn(updatedOn)
            .isUpToDate(isUpToDate)
            .build();
    }
}