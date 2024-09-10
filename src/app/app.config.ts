import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideAnimationsAsync(), provideHttpClient()]
};

export enum Api {
  NodeDownload = "https://api.npmjs.org/versions/${packageName}/last-week",
  NodePackage = "https://registry.npmjs.org/${packageName}",
  MavenDependency = "https://central.sonatype.com/api/internal/browse/component/versions?sortField=normalizedVersion&sortDirection=desc&page=0&size=10&filter=namespace:${group},name:${artifact}",
  GradlePlugin = "https://plugins.gradle.org/m2/${pluginPath}/maven-metadata.xml",
  Proxy = "https://api.allorigins.win/get?url=${originalUrl}",
}