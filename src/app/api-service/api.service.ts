import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, retry, throwError } from "rxjs";
import * as fxml from 'fast-xml-parser';
import { SettingsService } from "../settings/settings.service";

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private readonly httpClient: HttpClient, public settingsService: SettingsService) {

     }

    getNodePackageDownloadInfo(packageName: string) {
        let downloadInfoUrl = ApiUrl.NodeDownload.replace('${packageName}', encodeURIComponent(packageName));
        return this.httpClient.get(downloadInfoUrl);
    }

    getNodePackageInfo(packageName: string) {
        let packageInfoUrl = ApiUrl.NodePackage.replace('${packageName}', encodeURIComponent(packageName));
        return this.httpClient.get(packageInfoUrl);
    }

    getMavenDependencyVersions(group: string, artifact: string) {
        let url = ApiUrl.MavenDependency
            .replace('${group}', encodeURIComponent(group))
            .replace('${artifact}', encodeURIComponent(artifact));
        return this.httpClient.get(url);
    }

    getGradlePluginVersions(pluginName: string) {
        if (this.settingsService.getSettings().corsProxy) {
            let pluginMetadataUrl = ApiUrl.GradlePlugin.replace('${pluginPath}', `${pluginName.replaceAll('.', '/')}/${pluginName}.gradle.plugin`);
            let proxyUrl = this.settingsService.getSettings().corsProxy + encodeURIComponent(pluginMetadataUrl);
            return this.httpClient.get(proxyUrl, { responseType: "text" })
                .pipe(retry({ count: 5, delay: 1000 }))
                .pipe(map((respXmlString: string) => {
                    let parser = new fxml.XMLParser();
                    let respObj = parser.parse(respXmlString);
                    return respObj;
                }));
        } else {
            return throwError(() => {
                let errMsg = 'Cors Proxy not set in settings, cannot fetch gradle plugin versions without it';
                console.error(errMsg);
                return new Error(errMsg);
            });
        }
    }
}

export enum ApiUrl {
    NodeDownload = "https://api.npmjs.org/versions/${packageName}/last-week",
    NodePackage = "https://registry.npmjs.org/${packageName}",
    MavenDependency = "https://central.sonatype.com/api/internal/browse/component/versions?sortField=normalizedVersion&sortDirection=desc&page=0&size=10&filter=namespace:${group},name:${artifact}",
    GradlePlugin = "https://plugins.gradle.org/m2/${pluginPath}/maven-metadata.xml",
    Proxy = "http://localhost:3040/get?url="
}