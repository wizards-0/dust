import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, retry } from "rxjs";
import * as fxml from 'fast-xml-parser';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private httpClient:HttpClient){}

    getNodePackageDownloadInfo(packageName:string) {
        let downloadInfoUrl = ApiUrl.NodeDownload.replace('${packageName}', encodeURIComponent(packageName));
        return this.httpClient.get(downloadInfoUrl);
    }

    getNodePackageInfo(packageName:string) {
        let packageInfoUrl = ApiUrl.NodePackage.replace('${packageName}', encodeURIComponent(packageName));
        return this.httpClient.get(packageInfoUrl);
    }

    getMavenDependencyVersions(group:string,artifact:string){
        let url = ApiUrl.MavenDependency
        .replace('${group}',encodeURIComponent(group))
        .replace('${artifact}',encodeURIComponent(artifact));
        return this.httpClient.get(url);
    }

    getGradlePluginVersions(pluginName:string){
        let pluginMetadataUrl = ApiUrl.GradlePlugin.replace('${pluginPath}',`${pluginName.replaceAll('.', '/')}/${pluginName}.gradle.plugin`);
        let proxyUrl = ApiUrl.Proxy.replace('${originalUrl}',encodeURIComponent(pluginMetadataUrl));
        return this.httpClient.get(proxyUrl, { responseType: "text" })
        .pipe(retry({count:5,delay:1000}))
        .pipe(map( (respXmlString:string) => {
            let parser = new fxml.XMLParser();
            let respObj = parser.parse(respXmlString);
            return respObj;
        }));
    }
}

export enum ApiUrl {
    NodeDownload = "https://api.npmjs.org/versions/${packageName}/last-week",
    NodePackage = "https://registry.npmjs.org/${packageName}",
    MavenDependency = "https://central.sonatype.com/api/internal/browse/component/versions?sortField=normalizedVersion&sortDirection=desc&page=0&size=10&filter=namespace:${group},name:${artifact}",
    GradlePlugin = "https://plugins.gradle.org/m2/${pluginPath}/maven-metadata.xml",
    Proxy = "https://api.allorigins.win/get?url=${originalUrl}",
}