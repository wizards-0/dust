import { HttpClient } from "@angular/common/http";
import { SettingsService } from "../settings/settings.service";
import { ApiCaller } from "./api-caller";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class ApiService {
    private readonly apiCaller:ApiCaller;
    constructor(public readonly httpClient: HttpClient, public settingsService: SettingsService) {
        this.apiCaller = new ApiCaller(httpClient,settingsService);
     }

    getNodePackageDownloadInfo(packageName: string) {        
        return this.apiCaller.getNodePackageDownloadInfo(packageName);
    }

    getNodePackageInfo(packageName: string) {
        return this.apiCaller.getNodePackageInfo(packageName);
    }

    getMavenDependencyVersions(group: string, artifact: string) {
        return this.apiCaller.getMavenDependencyVersions(group,artifact);
    }

    getGradlePluginVersions(pluginName: string) {
        return this.apiCaller.getGradlePluginVersions(pluginName);
    }
}

export enum ApiUrl {
    NodeDownload = "https://api.npmjs.org/versions/${packageName}/last-week",
    NodePackage = "https://registry.npmjs.org/${packageName}",
    MavenDependency = "https://central.sonatype.com/api/internal/browse/component/versions?sortField=normalizedVersion&sortDirection=desc&page=0&size=10&filter=namespace:${group},name:${artifact}",
    GradlePlugin = "https://plugins.gradle.org/m2/${pluginPath}/maven-metadata.xml",
    Proxy = "http://localhost:3040/get?url="
}