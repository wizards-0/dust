import { HttpClient } from "@angular/common/http";
import { List, Map } from "immutable";
import { Dependency } from "../model/dependency";
import { Version } from "../model/version";
import { catchError, delay, from, map, mergeAll, Observable, of, reduce, retry } from "rxjs";
import { getVersionWithRelativeDownloads } from "../dependency-updater.component";
import { DateTime } from "luxon";
import { Injectable } from "@angular/core";
import { ApiService } from "../../api-service/api.service";
import { SettingsService } from "../../settings/settings.service";

@Injectable({
    providedIn: 'root',
})
export class GradleProcessor {
    
    gradleFile:GradleFile = new GradleFile(List([]),new FileIndexRange(-1,-1),new FileIndexRange(-1,-1),new FileIndexRange(-1,-1));

    constructor(private apiService: ApiService, private settingsService:SettingsService) { }

    processBuildGradle(buildGradle: string) {
        let lines = List(buildGradle.replaceAll('\'', '"').split('\n'));
        this.gradleFile = this.getBuildFileParts(lines);
        let dependencyUpdatedOn = this.gradleFile.getDependencyUpdatedOn();

        const dependencies = this.parseDependencyLines(this.gradleFile.getDependencyLines(), dependencyUpdatedOn);
        const pluginDependencies = this.parsePluginLines(this.gradleFile.getPluginLines(),dependencyUpdatedOn);

        return {
            dependencyList$: this.fetchVersions(dependencies),
            pluginDependencyList$: this.fetchPluginVersions(pluginDependencies)
        }
    }

    fetchVersions(dependencies: List<Dependency>): Observable<List<Dependency>> {
        let versionInfoResp = dependencies.map(dep => {            
            let nameParts = dep.name.split(':');
            let group = nameParts[0];
            let artifact = nameParts[1]
            return this.apiService.getMavenDependencyVersions(group,artifact).pipe(map((resp: any) => {

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

        return from(versionInfoResp)
            .pipe(mergeAll())
            .pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])))
            .pipe(map(deps => deps.sortBy(dep => dep.name)));
    }

    fetchPluginVersions(dependencies: List<Dependency>): Observable<List<Dependency>> {
        let versionInfoResp = dependencies.map(dep => {
            return this.apiService.getGradlePluginVersions(dep.name)
            .pipe(map((resp: any) => {

                let lastUpdated = DateTime.fromFormat(resp.metadata.versioning.lastUpdated+'','yyyyLLddHHmmss');

                let versions = List(resp.metadata.versioning.versions.version)
                    .map(ver => ver+'')
                    .reverse()
                    .slice(0, 10)
                    .map(ver => Version.builder().version(ver).build());

                let versionsWithLastUpdated = versions.set(0, versions.get(0,Version.empty()).toBuilder()
                    .publishDate(lastUpdated.toMillis())
                    .build());

                return dep.toBuilder()
                    .versions(versionsWithLastUpdated)
                    .build();
            }),catchError(()=>of(dep)));
        });

        return from(versionInfoResp)
            .pipe(mergeAll())
            .pipe(reduce((acc, dep) => acc.push(dep), List<Dependency>([])))
            .pipe(map(deps => deps.sortBy(dep => dep.name)));;
    }

    getBuildFileParts(lines: List<string>):GradleFile {
        let initialValue:{currentSection:string,braceCount:number,fileParts:GradleFile} = {
            currentSection: '',
            braceCount: 0,
            fileParts: new GradleFile(lines,new FileIndexRange(-1,-1),new FileIndexRange(-1,-1),new FileIndexRange(-1,-1))
        }

        let accumulatedResult = lines.reduce((accumulator:{currentSection:string,braceCount:number,fileParts:GradleFile}, line:string, index:number) => {
            let braceCount: number;
            let section = accumulator.currentSection;
            let sectionStartIndex = -1;
            let fileParts = accumulator.fileParts;
            let updatedFileParts;

            if (line.includes('plugins')) {
                section = 'plugins';
                sectionStartIndex = index;
            }

            if (line.includes('dependencies') || line.includes('dependencyResolutionManagement')) {
                section = 'dependencies';
                sectionStartIndex = index;
            }

            if (line.includes('dependencyUpdatedOn')) {
                section = 'dependencyUpdatedOn';
                sectionStartIndex = index;
            }

            if (line.trim().endsWith('{') && section.length > 0) {
                braceCount = accumulator.braceCount + 1;
            } else if (line.includes('}') && section.length > 0) {
                braceCount = accumulator.braceCount - 1;
            } else {
                braceCount = accumulator.braceCount;
            }

            switch(section) {
                case 'plugins': {
                    let startIndex = sectionStartIndex != -1 ? sectionStartIndex : fileParts.pluginLineIndices.startIndex;
                    updatedFileParts = fileParts.withPluginLineIndices(new FileIndexRange(startIndex,index));
                    break;
                }
                case 'dependencies': {
                    let startIndex = sectionStartIndex != -1 ? sectionStartIndex : fileParts.dependencyLineIndices.startIndex;
                    updatedFileParts = fileParts.withDependencyLineIndices(new FileIndexRange(startIndex,index));
                    break;
                }
                case 'dependencyUpdatedOn': {
                    let startIndex = sectionStartIndex != -1 ? sectionStartIndex : fileParts.dependencyUpdatedOnLineIndices.startIndex;
                    updatedFileParts = fileParts.withDependencyUpdatedOnLineIndices(new FileIndexRange(startIndex,index));
                    break;
                }
                default: {
                    updatedFileParts = fileParts;
                }
            }
            
            if(braceCount == 0){
                section = '';
            }

            return {
                currentSection: section,
                braceCount: braceCount,
                fileParts: updatedFileParts
            };
        }, initialValue);

        return accumulatedResult.fileParts;
    }


    parsePluginLines(pluginLines: List<string>, dependencyUpdatedOn: any) {
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

    parseDependencyLines(dependencyLines: List<string>, dependencyUpdatedOn: any) {
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

        let updatedPluginLines = this.gradleFile.getPluginLines().map( (line:string) => {
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

        let updatedDependencyLines = this.gradleFile.getDependencyLines().map( (line:string) => {
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
            .concat(dependencyList.concat(pluginDependencyList).map(dep => `"${dep.name}":${dep.updatedOn}`))
            .push('} */');

        let updatedLines = this.gradleFile.lines.map( (line:string,index:number) => {
            let updatedLine;
            if(index >= this.gradleFile.pluginLineIndices.startIndex && index <= this.gradleFile.pluginLineIndices.endIndex){
                updatedLine = updatedPluginLines.get(index-this.gradleFile.pluginLineIndices.startIndex,'');
            } else if(index >= this.gradleFile.dependencyLineIndices.startIndex && index <= this.gradleFile.dependencyLineIndices.endIndex){
                updatedLine = updatedDependencyLines.get(index-this.gradleFile.dependencyLineIndices.startIndex,'');
            } else if(this.gradleFile.dependencyUpdatedOnLineIndices.startIndex !=-1 && index >= this.gradleFile.dependencyUpdatedOnLineIndices.startIndex){
                updatedLine = undefined;
            }
            else {
                updatedLine = line
            }
            return updatedLine;
        }).filter(line => line != undefined);
        return updatedLines.concat(dependencyUpdatedOnLines).join('\n');
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
        let diffInDays = DateTime.now().startOf('day').diff(DateTime.fromMillis(updatedOn).startOf('day')).as('days');

        if (diffInDays <= this.settingsService.getSettings().updateCycle) {
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

export class GradleFile {
    public readonly lines:List<string>;
    public readonly pluginLineIndices:FileIndexRange;
    public readonly dependencyLineIndices:FileIndexRange;
    public readonly dependencyUpdatedOnLineIndices:FileIndexRange;
    constructor(lines:List<string>,pluginLineIndices:FileIndexRange,dependencyLineIndices:FileIndexRange,dependencyUpdatedOnLineIndices:FileIndexRange){
        this.lines = lines;
        this.pluginLineIndices = pluginLineIndices;
        this.dependencyLineIndices = dependencyLineIndices;
        this.dependencyUpdatedOnLineIndices = dependencyUpdatedOnLineIndices;
    }
    withPluginLineIndices(pluginLineIndices:FileIndexRange):GradleFile{
        return new GradleFile(
            this.lines,
            pluginLineIndices,
            this.dependencyLineIndices,
            this.dependencyUpdatedOnLineIndices
        );
    }
    withDependencyLineIndices(dependencyLineIndices:FileIndexRange):GradleFile{
        return new GradleFile(
            this.lines,
            this.pluginLineIndices,
            dependencyLineIndices,
            this.dependencyUpdatedOnLineIndices
        );
    }
    withDependencyUpdatedOnLineIndices(dependencyUpdatedOnLineIndices:FileIndexRange):GradleFile{
        return new GradleFile(
            this.lines,
            this.pluginLineIndices,
            this.dependencyLineIndices,
            dependencyUpdatedOnLineIndices
        );
    }
    getPluginLines():List<string> {
        return this.lines.slice(this.pluginLineIndices.startIndex,this.pluginLineIndices.endIndex+1);
    }
    getDependencyLines():List<string> {
        return this.lines.slice(this.dependencyLineIndices.startIndex,this.dependencyLineIndices.endIndex+1);
    }
    getDependencyUpdatedOn() {         
         if(this.dependencyUpdatedOnLineIndices.startIndex != -1){            
            let dependencyUpdatedOnLines = this.lines.slice(this.dependencyUpdatedOnLineIndices.startIndex,this.dependencyUpdatedOnLineIndices.endIndex+1);            
            let jsonPart = dependencyUpdatedOnLines.slice(1,-1).join(',');            
            let dependencyUpdatedOnJson = '{' + jsonPart.substring(0, jsonPart.length) + '}';
            return JSON.parse(dependencyUpdatedOnJson);    
        } else {
            return {};
        }
    }
}

export class FileIndexRange {
    public readonly startIndex:number;
    public readonly endIndex:number;
    constructor(startIndex:number,endIndex:number){
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }
}