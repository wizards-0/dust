import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { SettingsService } from "../settings/settings.service";
import { DateTime } from "luxon";

export class ApiCaller {
    constructor(private readonly httpClient: HttpClient, public settingsService: SettingsService) {
    }

    getNodePackageDownloadInfo(packageName: string) {
        return packageName.startsWith('my') ? of({}) : of(nodeVersionDownloadInfo);
    }

    getNodePackageInfo(packageName: string) {
        return packageName.startsWith('my') ? of({}) : of(nodeVersionPublishInfo);
    }

    getMavenDependencyVersions(group: string, artifact: string) {
        return (group.startsWith('my') || artifact.startsWith('my')) ? of({}) : of(mavenPackageVersions);
    }

    getGradlePluginVersions(pluginName: string) {
        return pluginName.startsWith('my') ? of({}) : of(gradlePluginVersions);
    }
}

const nodeVersionDownloadInfo = {
    downloads: {
        "1": 1000,
        "2": 2000,
        "3": 3000,
        "4": 4000,
        "5": 5000,
        "6": 6000,
        "7": 7000,
        "8": 8000,
        "9": 9000,
        "10": 10000,
        "11": 11000,
        "12": 12000,
        "13": 13000,
        "14": 14000,
        "15": 15000,
        "16": 16000,
        "17": 17000,
        "18": 18000,
        "19": 17500,
        "20": 16500,
        "21": 6500,
        "22-beta": 2500
    }
}

const nodeVersionPublishInfo = {
    "dist-tags": {
        "latest": "21",
        "v21-lts": "21",
        "v20-lts": "20"
    },
    "time": {
        "1": "2005-01-01",
        "2": "2006-01-01",
        "3": "2007-01-01",
        "4": "2008-01-01",
        "5": "2009-01-01",
        "6": "2010-01-01",
        "7": "2011-01-01",
        "8": "2012-01-01",
        "9": "2013-01-01",
        "10": "2014-01-01",
        "11": "2015-01-01",
        "12": "2016-01-01",
        "13": "2017-01-01",
        "14": "2018-01-01",
        "15": "2019-01-01",
        "16": "2020-01-01",
        "17": "2021-01-01",
        "18": "2022-01-01",
        "19": "2023-01-01",
        "20": "2024-01-01",
        "21": "2025-01-01",
        "22-beta": "2025-01-21"
    }
}

const mavenPackageVersions = {
    components: [
        { version: "1", dependencyOfCount: 1000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2005-01-01").toMillis() },
        { version: "2", dependencyOfCount: 2000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2006-01-01").toMillis() },
        { version: "3", dependencyOfCount: 3000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2007-01-01").toMillis() },
        { version: "4", dependencyOfCount: 4000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2008-01-01").toMillis() },
        { version: "5", dependencyOfCount: 5000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2009-01-01").toMillis() },
        { version: "6", dependencyOfCount: 6000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2010-01-01").toMillis() },
        { version: "7", dependencyOfCount: 7000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2011-01-01").toMillis() },
        { version: "8", dependencyOfCount: 8000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2012-01-01").toMillis() },
        { version: "9", dependencyOfCount: 9000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2013-01-01").toMillis() },
        { version: "10", dependencyOfCount: 10000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2014-01-01").toMillis() },
        { version: "11", dependencyOfCount: 11000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2015-01-01").toMillis() },
        { version: "12", dependencyOfCount: 12000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2016-01-01").toMillis() },
        { version: "13", dependencyOfCount: 13000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2017-01-01").toMillis() },
        { version: "14", dependencyOfCount: 14000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2018-01-01").toMillis() },
        { version: "15", dependencyOfCount: 15000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2019-01-01").toMillis() },
        { version: "16", dependencyOfCount: 16000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2020-01-01").toMillis() },
        { version: "17", dependencyOfCount: 17000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2021-01-01").toMillis() },
        { version: "18", dependencyOfCount: 18000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2022-01-01").toMillis() },
        { version: "19", dependencyOfCount: 17500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2023-01-01").toMillis() },
        { version: "20", dependencyOfCount: 16500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2024-01-01").toMillis() },
        { version: "21", dependencyOfCount: 6500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2025-01-01").toMillis() },
        { version: "22-beta", dependencyOfCount: 6500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2025-01-01").toMillis() }
    ]
}

const gradlePluginVersions = {
    metadata: {
        versioning: {
            lastUpdated: "20250101000000",
            versions: {
                version: [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11",
                    "12",
                    "13",
                    "14",
                    "15",
                    "16",
                    "17",
                    "18",
                    "19",
                    "20",
                    "21",
                    "22-beta"]
            }
        }
    }
}