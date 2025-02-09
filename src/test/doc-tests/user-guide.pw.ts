import { BrowserContext, Page, expect } from "@playwright/test";
import { runDocTests } from "./doc-test-runner";

const DEPENDENCIES_ID = 'Dependencies';
const DEV_DEPENDENCIES_ID = 'DevDependencies';
const PLUGIN_DEPENDENCIES_ID = 'PluginDependencies';

const quickStartTest = {
    title: 'Quick start doc test',
    doc: `## Quick Start
- Copy **package.json** or **build.gradle** or **settings.gradle** to clipboard from your source
- Paste it in the appropriate text box and click on check
- Click on expand arrow in right most column, to see versions for that dependency
- Select the desired version for each dependency from version detail grid
- Click on copy, paste updated file back to source

---`,
    test: async (page: Page, context: BrowserContext) => {

        let minPackageJson = {
            "dependencies": {
                "tslib": "^2.3.0"
            }
        }
        await page.goto('/');
        await submitPackageJson(page, minPackageJson);

        await waitForDependenciesToLoad(page);
        await selectDependencyVersion(page, DEPENDENCIES_ID, 0, 1);

        await page.locator('ace-button#copyPackageJsonButton').click();

        const resultPackageJson = JSON.parse(await getClipboardText(page, context));
        expect(resultPackageJson.dependencies.tslib).toBeTruthy();
    }
}

const buildFileInputTest = {
    title: 'Build file input doc test',
    doc: `
## Detailed Guide

### Build File Input
Currently, this tool supports Node & Gradle build files

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        await expect(page.locator('mat-form-field')).toHaveCount(2);
    }
}

const nodeBuildFileTest = {
    title: 'Build file Node doc test',
    doc: `
#### Node
It is able to parse node's package.json for getting dependencies. Sections dependencies & dev dependencies are parsed. Others like peer dependencies are ignored.
They are not mandatory, but at least one of them should be present. 

Since this is a tool meant to be used by devs, and package.json will usually be copied from source, There are no validation on structure of json.
The only validation is that string itself is a valid json. So if in json, dependencies is an array instead of usual object, the tool will simply break.

For local packages that are not available in the npmjs registry, they will still be listed in the dependency grid, but will have an empty version detail grid.

---`,
    test: async (page: Page, context: BrowserContext) => {
        let validPackageJsonSetup = async (page: Page) => {
            let packageJson = {
                "dependencies": {
                    "tslib": "^2.3.0"
                },
                "devDependencies": {
                    "my-ace-lib": "^1.0.22"
                },
                "peerDependencies": {
                    "rxjs": "~7.8.0"
                }
            }
            await page.goto('/');
            await submitPackageJson(page, packageJson);
            await waitForDependenciesToLoad(page);
        };

        let testPeerDependenciesAreIgnored = async (page: Page) => {
            await verifyDependencyCount(page, 2);
        };

        let testLocalLibLoadsWithoutVersions = async (page: Page) => {
            await expect(page.getByText('my-ace-lib')).toBeVisible();
            await toggleDependency(page, DEV_DEPENDENCIES_ID, 0);
            await page.waitForTimeout(50);
            await expect(page.locator(`#${DEV_DEPENDENCIES_ID}-versionsTable-0`)).not.toBeVisible();
        };

        let testDependencyOnlyPackageJson = async (page: Page) => {
            let packageJson = {
                "dependencies": {
                    "tslib": "^2.3.0"
                }
            }
            await submitPackageJson(page, packageJson);
            await waitForDependenciesToLoad(page);
            await verifyDependencyTypeIsNotVisible(page, DEV_DEPENDENCIES_ID);
        };

        let testDevDependencyOnlyPackageJson = async (page: Page) => {
            let packageJson = {
                "devDependencies": {
                    "typescript": "^2.3.0"
                }
            }
            await submitPackageJson(page, packageJson);
            await waitForDependenciesToLoad(page);
            await verifyDependencyTypeIsNotVisible(page, DEPENDENCIES_ID);
        };

        let testInvalidJson = async (page: Page) => {
            await page.locator('textarea#packageJsonTextArea').fill('KEKW');
            await page.locator('ace-button#checkPackageJson').click();
            await verifyErrorIsShown(page, 'Invalid Json');
        };

        let testEmptyPackageJson = async (page: Page) => {
            let packageJson = {
            }
            await submitPackageJson(page, packageJson);
            await verifyErrorIsShown(page, 'Invalid build file');
        };

        let testInvalidPackageJson = async (page: Page) => {
            let packageJson = {
                "devDependencies": [{
                    "typescript": "^2.3.0"
                }]
            }
            await submitPackageJson(page, packageJson);
            await verifyErrorIsShown(page, 'Invalid build file');
        };

        await validPackageJsonSetup(page);
        await testPeerDependenciesAreIgnored(page);
        await testLocalLibLoadsWithoutVersions(page);
        await testDependencyOnlyPackageJson(page);
        await testDevDependencyOnlyPackageJson(page);
        await testInvalidJson(page);
        await testEmptyPackageJson(page);
        await testInvalidPackageJson(page);
    }
}

const gradleBuildFileTest = {
    title: 'Build file Gradle doc test',
    doc: `
#### Gradle
For gradle, you can paste build.gradle or settings.gradle. It is able to parse dev dependencies (api, impl, test, etc) and plugin dependencies for which you have to specify version.

In gradle there are lot of ways to write dependency version. But only two formats are currently parsable by this tool
- For dependencies, supported format is **{group}:{artifact}:{version}**
- For plugins, supported format is **id "{pluginName}" version"{version}"**

All the dependencies / plugins which are not in this format will be ignored. And dependencies in above format will be processed.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        let testBuildGradle = async (page: Page) => {
            let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
}
dependencies {
    implementation 'com.google.guava:guava:28.1-jre'
}`;
            await submitGradleFile(page, buildGradle);
            await waitForDependenciesToLoad(page);
            await verifyDependencyCount(page, 2);
        };

        let testSettingsGradle = async (page: Page) => {
            let settingsGradle = `
pluginManagement {
	plugins {
		id "java-library"
		id "org.sonarqube" version "5.1.0.4882"
	}
	resolutionStrategy {
	}
	repositories {
		mavenCentral()
		gradlePluginPortal()
	}
}

dependencyResolutionManagement {
	versionCatalogs {
		libs {
			library("immutables.value","org.immutables:value:2.10.1")
		}

		testLibs{
			library("junit.api","org.junit.jupiter:junit-jupiter-api:5.10.3")
		}
	}
}
rootProject.name = "ace"`;
            await submitGradleFile(page, settingsGradle);
            await waitForDependenciesToLoad(page);
            await verifyDependencyCount(page, 3);
        };

        let testDependencyFormat = async (page: Page) => {
            let buildGradle = `
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.google.guava:guava:28.1-jre'
}`;
            await submitGradleFile(page, buildGradle);
            await waitForDependenciesToLoad(page);
            await verifyDependencyCount(page, 1);
            await verifyDependencyTypeIsNotVisible(page, PLUGIN_DEPENDENCIES_ID);
        };

        let testPluginFormat = async (page: Page) => {
            let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
    id 'java-library'
}`;
            await submitGradleFile(page, buildGradle);
            await waitForDependenciesToLoad(page);
            await verifyDependencyCount(page, 1);
            await verifyDependencyTypeIsNotVisible(page, DEPENDENCIES_ID);
        };

        let testUnsupportedFormat = async (page: Page) => {
            let buildGradle = `
plugins {
    id 'java-library'
}
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}`;
            await submitGradleFile(page, buildGradle);
            await verifyErrorIsShown(page, 'Invalid build file');
            await submitGradleFile(page, '');
            await verifyErrorIsShown(page, 'Invalid build file');
        };

        await testBuildGradle(page);
        await testSettingsGradle(page);
        await testDependencyFormat(page);
        await testPluginFormat(page);
        await testUnsupportedFormat(page);
        expect(userGuideDocTests.tests).toBeTruthy();
    }
}

const dependencyListTest = {
    title: 'Dependency List',
    doc: `
### Dependency List
After the build file is parsed; Dependency details will be fetched from repository APIs. Node & Gradle both have two lists. Node has Dependencies & Dev Dependencies. Gradle has Dependencies & Plugin Dependencies. At least one list will be present in each build system.

Dependency List has following columns which are common to Node & Gradle

| Column Name       | Purpose                                                           |
|-------------------|-------------------------------------------------------------------|
| Select            | Multi select dependencies for updating version in bulk            |
| Name              | Name of the dependency                                            |
| Current Version   | Version present in the current build file                         |
| Update Version    | Version which will be used in updated file                        |
| Updated           | Shows a check mark if a version was selected for that dependency to track progress |
| Latest            | Shows a check mark if current version matches the latest version from relevant versions |
| Versions          | Each row has an expand icon, which can be clicked to see version details |

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');

        let verifyColumns = async (page: Page, columns: string[]) => {

            for (let columnName of columns) {
                await expect(page.locator(`//th[contains(text(), "${columnName}")]`)).toHaveCount(2);
            }
            await expect(page.locator(`//table[contains(@id,"dependencyListTable")]/thead/tr/th`)).toHaveCount((columns.length + 1) * 2);
        };

        let testNodeColumns = async (page: Page) => {
            let packageJson = {
                "dependencies": {
                    "tslib": "^2.3.0"
                },
                "devDependencies": {
                    "typescript": "^2.3.0"
                }
            }
            await submitPackageJson(page, packageJson);
            await waitForDependenciesToLoad(page);
            await verifyColumns(page, ['Name', 'Current Version', 'Update Version', 'Updated', 'Latest', 'Versions']);
        };

        let testGradleColumns = async (page: Page) => {
            let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
}
dependencies {
    implementation 'com.google.guava:guava:28.1-jre'
}`;
            await submitGradleFile(page, buildGradle);
            await waitForDependenciesToLoad(page);
            await verifyColumns(page, ['Name', 'Current Version', 'Update Version', 'Updated', 'Latest', 'Versions']);
        };

        await testNodeColumns(page);
        await testGradleColumns(page);
    }
}

const dependencyVersionTest = {
    title: 'Dependency Versions',
    doc: `
### Dependency Versions
Version detail grid, displays 10 most relevant versions along with latest for that dependency.
See **[Relevant Versions](/user-guide?id=relevant-versions)** for details.
Dependency versions have slight differences between build systems, as their repository API provide different attributes.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');

        let testNodeVersions = async (page: Page) => {
            let packageJson = {
                "dependencies": {
                    "tslib": "^2.3.0"
                },
                "devDependencies": {
                    "typescript": "^2.3.0"
                }
            }
            await submitPackageJson(page, packageJson);
            await waitForDependenciesToLoad(page);
            await verifyVersionCount(page, 20);
        };

        let testGradleVersions = async (page: Page) => {
            let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
}
dependencies {
    implementation 'com.google.guava:guava:28.1-jre'
}`;
            await submitGradleFile(page, buildGradle);
            await waitForDependenciesToLoad(page);
            await verifyVersionCount(page, 20);
        };

        await testNodeVersions(page);
        await testGradleVersions(page);
    }
}

const nodeDependencyVersionTest = {
    title: 'Dependency Versions Node',
    doc: `
#### Node

| Column Name       | Purpose                                                           |
|-------------------|-------------------------------------------------------------------|
| Version           | Name of the dependency                                            |
| Downloads (7 days)| No. of times this version was downloaded from repo in last 7 days |
| Tags              | Tags associated with this version                                 |
| Publish Date      | Date when this version was published                              |

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');

        let verifyColumns = async (page: Page, columns: string[]) => {

            for (let columnName of columns) {
                await expect(page.locator(`//th[contains(text(), "${columnName}") and contains(@class,"version-detail-header")]`)).toHaveCount(2);
            }
            await expect(page.locator(`//table[contains(@id,"versionsTable")]/thead/tr/th`)).toHaveCount((columns.length + 1) * 2);
        };

        let packageJson = {
            "dependencies": {
                "tslib": "^2.3.0"
            },
            "devDependencies": {
                "typescript": "^2.3.0"
            }
        }
        await submitPackageJson(page, packageJson);
        await waitForDependenciesToLoad(page);

        await verifyColumns(page, ['Version', 'Downloads (7 days)', 'Tags', 'Publish Date']);
    }
};

const gradleDependencyVersionTest = {
    title: 'Dependency Versions Gradle',
    doc: `
#### Gradle
| Column Name           | Purpose                                                           |
|-----------------------|-------------------------------------------------------------------|
| Version               | Name of the dependency                                            |
| Depended On           | No. of other dependencies that utilize this version               |
| Vulnerability Count   | Count of known vulnerabilities in OSS scan                        |
| Publish Date          | Date when this version was published                              |

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');

        let verifyColumns = async (page: Page, columns: string[]) => {

            for (let columnName of columns) {
                await expect(page.locator(`//th[contains(text(), "${columnName}") and contains(@class,"version-detail-header")]`)).toHaveCount(2);
            }
            await expect(page.locator(`//table[contains(@id,"versionsTable")]/thead/tr/th`)).toHaveCount((columns.length + 1) * 2);
        };

        let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
}
dependencies {
    implementation 'com.google.guava:guava:28.1-jre'
}`;
        await submitGradleFile(page, buildGradle);
        await waitForDependenciesToLoad(page);

        await verifyColumns(page, ['Version', 'Depended On', 'Vulnerability Count', 'Publish Date']);
    }
}

const dependencyVersionSelectionTest = {
    title: 'Dependency Version Selection',
    doc: `
#### Version Selection
After expanding dependency, a sub grid with **[Relevant Versions](/user-guide?id=relevant-versions)** will be displayed.
Select the radio button with desired version to initiate selection.
This version will be populated in the text box above grid, this is done to provide option for manual edits if required.
When selecting a new version, If the existing version had identifiable **[prefix*](/user-guide?id=version-prefix)**,
it is automatically added to the new version. This is done as it is the most common way to describe versions in node.
Example "@angular/cli": "^18.1.2", is updated to "@angular/cli": "^19.0.5". Version in text box will automatically apply '^' prefix to the new version.

Text Box can also be used to specify version manually, when versions are not available from APIs or they are absent in version grid.
Click on select button after confirming the version is in text box, to complete version selection.
Sub grid will auto collapse on clicking select to speed up the process.
Dependency will have update version populated in main grid and it will be marked with green check to track progress.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        let packageJson = {
            "dependencies": {
                "tslib": "^19"
            },
            "devDependencies": {
                "typescript": "^2.3.0"
            }
        }
        await submitPackageJson(page, packageJson);
        await waitForDependenciesToLoad(page);
        await toggleDependency(page, DEPENDENCIES_ID, 0);
        await expect(page.locator(`input#${DEPENDENCIES_ID}-versionInputText-0`)).toHaveValue('^19');
        await expect(page.locator(`#${DEPENDENCIES_ID}-versionRadio-0-2-input`)).toBeChecked();
        await page.locator(`mat-radio-button#${DEPENDENCIES_ID}-versionRadio-0-0`).click();
        await expect(page.locator(`input#${DEPENDENCIES_ID}-versionInputText-0`)).toHaveValue('^21');
        await page.locator(`ace-button#${DEPENDENCIES_ID}-versionSelectButton-0`).click();
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('^21');
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-0`)).toBeVisible();

        await toggleDependency(page, DEV_DEPENDENCIES_ID, 0);
        page.locator(`input#${DEV_DEPENDENCIES_ID}-versionInputText-0`).fill('custom-version');
        await page.locator(`ace-button#${DEV_DEPENDENCIES_ID}-versionSelectButton-0`).click();
        await expect(page.locator(`td#${DEV_DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('custom-version');
        await expect(page.locator(`mat-icon#${DEV_DEPENDENCIES_ID}-updatedIndicator-0`)).toBeVisible();
    }
}

const versionPrefixTest = {
    title: 'Dependency Version Prefix',
    doc: `
#### *Version Prefix
If version is in format \`\`\`[symbols][wordChar][anything]\`\`\`, then symbols at the beginning are treated as prefix

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        let packageJson = {
            "dependencies": {
                "tslib": "^19"
            },
            "devDependencies": {
                "typescript": "18"
            }
        }
        await submitPackageJson(page, packageJson);
        await waitForDependenciesToLoad(page);

        await selectDependencyVersion(page, DEPENDENCIES_ID, 0, 0);
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('^21');

        await selectDependencyVersion(page, DEV_DEPENDENCIES_ID, 0, 0);
        await expect(page.locator(`td#${DEV_DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('21');
    }
}

const relevantVersionsTest = {
    title: 'Dependency Relevant Versions',
    doc: `
### Relevant Versions
Download stats is used to figure out relevant versions. Top 10 downloaded versions along with last updated version and version with "latest" tag if present are selected.
For calculating both top 10 downloads and latest version, **[Version Filter](/user-guide?id=version-filter)** is taken into consideration.
Versions having filter keyword in them will be filtered first, then rest of the operations will be performed. Namely figuring out top 10 and latest.
Number of versions are restricted to remove clutter. Most of the time desired version will be present in Top 10 most downloaded versions.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        await checkVersionExists(page,'22-beta',false);
    }
}

const multiUpdateTest = {
    title: 'Multi Update',
    doc: `
### Multi Update
This can update multiple dependencies to latest version. By default, this will apply latest version to selected dependencies.
If latest version is very new / unstable, 2nd 3rd or 4th latest version can be selected from dropdown.
If unwanted versions are showing up as latest, **[Version Filter](/user-guide?id=version-filter)** can be utilized to exclude them.
If no dependencies are selected, this operation will do nothing

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        let packageJson = {
            "dependencies": {
                "immutable": "^18",
                "rxjs": "~16",
                "tslib": "21"
            },
            "devDependencies": {
                "typescript": "18"
            }
        }
        await submitPackageJson(page, packageJson);
        await waitForDependenciesToLoad(page);
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-2`)).toBeVisible();

        await page.locator(`#${DEPENDENCIES_ID}-selectAllCheckBox`).click();
        await page.locator('#multiUpdateDependenciesButton').click();
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('^21');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-1`)).toHaveText('~21');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-2`)).toHaveText(/\s*/);
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-0`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-1`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-2`)).not.toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-0`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-1`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-2`)).toBeVisible();

        await page.locator(`#${DEPENDENCIES_ID}-selectDependencyCheckBox-1`).click();
        await page.locator('#latestOptionSelect').click();
        await page.getByText('2nd Latest').click();
        await page.locator('#multiUpdateDependenciesButton').click();
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('^20');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-1`)).toHaveText('~21');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-2`)).toHaveText('20');
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-0`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-1`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-2`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-0`)).not.toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-1`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-2`)).not.toBeVisible();

        await page.locator(`#${DEPENDENCIES_ID}-selectAllCheckBox`).click();
        await page.locator('#latestOptionSelect').click();
        await page.getByText('3rd Latest').click();
        await page.locator('#multiUpdateDependenciesButton').click();
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-0`)).toHaveText('^19');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-1`)).toHaveText('~19');
        await expect(page.locator(`td#${DEPENDENCIES_ID}-updateVersion-2`)).toHaveText('19');
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-0`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-1`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-updatedIndicator-2`)).toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-0`)).not.toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-1`)).not.toBeVisible();
        await expect(page.locator(`mat-icon#${DEPENDENCIES_ID}-latestIndicator-2`)).not.toBeVisible();
        await (expect(page.getByText('Dependencies updated.').first())).toBeVisible();

        await page.locator(`#${DEPENDENCIES_ID}-selectAllCheckBox`).click();
        await page.locator('#multiUpdateDependenciesButton').click();
        await (expect(page.getByText('No dependencies selected.'))).toBeVisible();
    }
}

const outputTest = {
    title: 'Output',
    doc: `
### Output
After making all the changes, click on copy button to copy updated build file to clipboard. Updated build file will have new versions for dependencies which were updated.
While no changes will be made to other part of build file. This can now be pasted to the build file in original source code.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/');
        let packageJson = {
            "dependencies": {
                "tslib": "^19"
            },
            "devDependencies": {
                "typescript": "18"
            }
        }
        await submitPackageJson(page, packageJson);
        await waitForDependenciesToLoad(page);

        await selectDependencyVersion(page, DEPENDENCIES_ID, 0, 0);
        await selectDependencyVersion(page, DEV_DEPENDENCIES_ID, 0, 0);

        await page.locator('ace-button#copyPackageJsonButton').click();
        await expect(page.getByText('Updated package Json copied to clipboard')).toBeVisible();
        const resultPackageJson = JSON.parse(await getClipboardText(page, context));
        let expectedpackageJson = {
            "dependencies": {
                "tslib": "^21"
            },
            "devDependencies": {
                "typescript": "21"
            }
        }
        expect(resultPackageJson).toEqual(expectedpackageJson);
    }
}

const settingsTest = {
    title: 'Settings',
    doc: `
## Settings
Settings allows you to specify color scheme, CORS proxy Url and Version Filter.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('/#/settings');
        await expect(page.getByText('Color Scheme')).toBeVisible();
        await expect(page.getByText('Cors Proxy', { exact: true })).toBeVisible();
        await expect(page.getByText('Version Filter')).toBeVisible();
        await expect(page.locator('mat-label')).toHaveCount(5);
    }
}

const settingsProxyUrlTest = {
    title: 'Settings Proxy Url',
    doc: `
### Proxy Url
API for gradle plugin dependencies does not allow CORS calls. Hence a CORS proxy is needed to make the API call.
Following are the options to provide CORS proxy URL
- Preferred option is to run CORS proxy locally. See **[setup](/dev-guide?id=setup)** for details.
After local server is up, \`\`\`http://localhost:3040/get?url=\`\`\` can be used as proxy URL.
- If the first method is not working for any reason, any other open source proxy can be deployed locally and its URL can be used.
It should work with format proxyUrl+originalUrl.  
Example "https://github.com/Rob--W/cors-anywhere"
- Least preferred option is to use a public proxy, like \`\`\`https://api.allorigins.win/get?url=\`\`\`.
This option will work, but its not very reliable, and it incurs cost to the provider hosting this service purely for test purpose.

---`,
    test: async (page: Page, context: BrowserContext) => {
        await page.goto('http://localhost:4200/#/settings');
        await page.locator('input#proxyUrlInputText').fill('');
        await page.goto('http://localhost:4200/#/home');
        let buildGradle = `
plugins {
    id 'org.springframework.boot' version '2.7.1'
}
dependencies {
    implementation 'com.google.guava:guava:28.1-jre'
}`;
        await submitGradleFile(page, buildGradle);
        await waitForDependenciesToLoad(page);
        await toggleDependency(page,PLUGIN_DEPENDENCIES_ID,0);
        await page.waitForTimeout(50);
        await expect(page.locator(`#${PLUGIN_DEPENDENCIES_ID}-versionsTable-0`)).not.toBeVisible();

        await page.goto('http://localhost:4200/#/settings');
        await page.locator('input#proxyUrlInputText').fill('http://localhost:3040/get?url=');

        await page.goto('http://localhost:4200/#/home');
        await submitGradleFile(page, buildGradle);
        await waitForDependenciesToLoad(page);
        await toggleDependency(page,PLUGIN_DEPENDENCIES_ID,0);
        await expect(page.locator(`#${PLUGIN_DEPENDENCIES_ID}-versionsTable-0`)).toBeVisible();
    }
}

const versionFilterTest = {
    title: 'Settings Version Filter',
    doc: `
### Version Filter
Version filter allows you to specify keywords for excluding versions.Filter is used to perform a contains check and not an exact match.
So all versions, having any of the filter strings in them will be excluded from version details grid.
This feature is mostly useful when you want to keep dependencies at latest version, but do not want to use beta versions.
This can ensure the top version is a stable one, allowing you to bulk select latest version for all dependencies.
Also the tracker column indicating if the dependency is on latest version becomes more useful.

---`,
    test: async (page: Page, context: BrowserContext) => {        

        let excludeVersion = async (page: Page,version:string) => {
            await page.goto('/#/settings');
            await page.locator('input#versionFilterInputText').fill(version);
            await page.locator('#addVersionFilterButton').click();            
        }

        let removeVersionExclusion = async (page: Page,version:string) => {
            await page.goto('/#/settings');            
            await page.locator(`//div/span[contains(text(),"${version}")]/../button`).click();            
        }

        let version = '21';
        await excludeVersion(page,version);
        await checkVersionExists(page,version,false);

        await removeVersionExclusion(page,version);
        await checkVersionExists(page,version,true);
    }
}

async function verifyErrorIsShown(page: Page, errorMessage: string) {
    await expect(page.getByText(errorMessage)).toBeVisible();
    await closeAlert(page);
}

async function submitPackageJson(page: Page, packageJson: any) {
    let packageJsonInput = JSON.stringify(packageJson);
    await page.locator('textarea#packageJsonTextArea').fill(packageJsonInput);
    await page.locator('ace-button#checkPackageJson').click();
}

async function waitForDependenciesToLoad(page: Page) {
    await expect(page.locator('table').nth(0)).toBeVisible({ timeout: 20000 });
}

async function toggleDependency(page: Page, dependencyType: string, dependencyIndex: number) {
    await page.locator(`button#${dependencyType}-detailsButton-${dependencyIndex}`).click();
}

async function selectDependencyVersion(page: Page, dependencyType: string, dependencyIndex: number, versionIndex: number) {
    await toggleDependency(page, dependencyType, dependencyIndex);
    await page.locator(`mat-radio-button#${dependencyType}-versionRadio-${dependencyIndex}-${versionIndex}`).click();
    await page.locator(`ace-button#${dependencyType}-versionSelectButton-${dependencyIndex}`).click();
}

async function getClipboardText(page: Page, context: BrowserContext) {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContent = await handle.jsonValue();
    return clipboardContent;
}

async function verifyDependencyCount(page: Page, count: number) {
    await expect(page.locator('tr.dependency-row')).toHaveCount(count);
}

async function verifyVersionCount(page: Page, count: number) {
    await expect(page.locator('tr.dependency-version-row')).toHaveCount(count);
}

async function closeAlert(page: Page) {
    await page.locator('#closeAlertBtn').click();
    await expect(page.locator('#closeAlertBtn')).not.toBeVisible();
}

async function submitGradleFile(page: Page, gradleFile: string) {
    await page.locator('textarea#gradleFileTextArea').fill(gradleFile);
    await page.locator('ace-button#checkGradleBuildFile').click();
}

async function verifyDependencyTypeIsNotVisible(page: Page, dependencyType: string) {
    await expect(page.locator(`#${dependencyType}-dependencyListTable`)).not.toBeVisible();
}

async function checkVersionExists(page: Page,version:string,shouldExist:boolean) {
    await page.goto('/');

    let packageJson = {
        "dependencies": {
            "tslib": "^19"
        },
        "devDependencies": {
            "typescript": "18"
        }
    }
    await submitPackageJson(page, packageJson);
    await waitForDependenciesToLoad(page);
    await toggleDependency(page,DEPENDENCIES_ID,0);            
    await expect(page.locator(`//td[contains(@id,"versionCell") and contains(text(),"${version}")]`)).toHaveCount(shouldExist ? 2 : 0);

    let buildGradle = `
        plugins {
            id 'org.springframework.boot' version '2.7.1'
        }
        dependencies {
            implementation 'com.google.guava:guava:28.1-jre'
        }`;
    await submitGradleFile(page, buildGradle);
    await waitForDependenciesToLoad(page);
    await toggleDependency(page,DEPENDENCIES_ID,0);            
    await expect(page.locator(`//td[contains(@id,"versionCell") and contains(text(),"${version}")]`)).toHaveCount(shouldExist ? 2 : 0);
}


const userGuideDocTests = {
    path: '/user-guide.md',
    tests: [
        quickStartTest,
        buildFileInputTest,
        nodeBuildFileTest,
        gradleBuildFileTest,
        dependencyListTest,
        dependencyVersionTest,
        nodeDependencyVersionTest,
        gradleDependencyVersionTest,
        dependencyVersionSelectionTest,
        versionPrefixTest,
        relevantVersionsTest,
        multiUpdateTest,
        outputTest,
        settingsTest,
        settingsProxyUrlTest,
        versionFilterTest
    ]
}

runDocTests(userGuideDocTests);