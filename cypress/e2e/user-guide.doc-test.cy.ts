import { runDocTests } from "./doc-test-runner";

let validPackageJson = {
  "name": "dust",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 0.0.0.0",
    "build": "rm -r docs/* && ng build --base-href /dust/ && cp -r dist/dust/browser/* docs && touch docs/.nojekyll && touch docs/docs/.nojekyll",
    "watch": "ng build --watch --configuration development",
    "test": "concurrently \"npm run start-proxy\" \"ng test\"",
    "tailwind": "tailwind -o public/tailwind-build.css --watch",
    "dev": "concurrently \"npm start\" \"npm run tailwind\" \"npm run start-proxy\"",
    "coverage": "concurrently \"npm run start-doc-generator\" \"npm run start-proxy\" \"ng test --no-watch --code-coverage\"",
    "start-proxy": "node cors_proxy/server.js",
    "start-doc-generator": "node doc-generator/app.js",
    "cy:open": "npx cypress open --config-file cypress.config.ts"
  },
  "private": true,
  "dependencies": {
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "^0.15.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "~5.5.2"
  }
}

const userGuideDocTests = {
  path: '/user-guide.md',
  tests: [
    {
      title: 'Quick start doc test',
      doc: `## Quick Start
- Copy **package.json** or **build.gradle** or **settings.gradle** to clipboard from your source
- Paste it in the appropriate text box and click on check
- Click on expand arrow in right most column, to see versions for that dependency
- Select the desired version for each dependency from version detail grid
- Click on copy, paste updated file back to source

---`,
      test: () => {
        cy.visit('http://localhost:4200');
        cy.contains('D . U . S . T . ');
        let packageJsonInput = JSON.stringify(validPackageJson);
        cy.get('textarea#packageJsonInput').type(packageJsonInput, { parseSpecialCharSequences: false, delay: 0 });
        cy.get('ace-button#checkPackageJson').click();

        cy.get('button#Dependencies-detailsButton-1', { timeout: 10000 }).click();
        cy.get('mat-radio-button#Dependencies-versionRadio-1-1').click();
        cy.get('ace-button#Dependencies-versionSelectButton-1').click();

        cy.get('button#DevDependencies-detailsButton-2').click();
        cy.get('mat-radio-button#DevDependencies-versionRadio-2-0').click();
        cy.get('ace-button#DevDependencies-versionSelectButton-2').click();

        cy.get('ace-button#copyPackageJsonButton').click();

        cy.window().its('navigator.clipboard')
          .then((clip) => clip.readText())
          .then((jsonString) => JSON.parse(jsonString))
          .should('have.nested.property', 'dependencies.tslib');
      }
    },
    {
      title: 'Build file input doc test',
      doc: `
## Detailed Guide

### Build File Input
Currently, this tool supports Node & Gradle build files

---`,
      test: () => {
        console.log('User Guide - Build File Input')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Build file Node doc test',
      doc: `
#### Node
It is able to parse node's package.json for getting dependencies. Sections dependencies & dev dependencies are parsed. Others like peer dependencies are ignored.
They are not mandatory, but at least one of them should be present. 

Since this is a tool meant to be used by devs, and package.json will usually be copied from source, There are no validation on structure of json.
The only validation is that string itself is a valid json. So if in json, dependencies is an array instead of usual object, the tool will simply break.

For local packages that are not available in the npmjs registry, they will still be listed in the dependency grid, but will have an empty version detail grid.

---`,
      test: () => {
        console.log('User Guide - Build File Node')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Build file Gradle doc test',
      doc: `
#### Gradle
For gradle, you can paste build.gradle or settings.gradle. It is able to parse dev dependencies (api, impl, test, etc) and plugin dependencies for which you have to specify version.

In gradle there are lot of ways to write dependency version. But only two formats are currently parsable by this tool
- For dependencies, supported format is **{group}:{artifact}:{version}**
- For plugins, supported format is **id "{pluginName}" version"{version}"**

All the dependencies / plugins which are not in this format will be ignored. And dependencies in above format will be processed.

---`,
      test: () => {
        console.log('User Guide - Build File Gradle')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Dependency List',
      doc: `
### Dependency List
After the build file is parsed; Dependency details will be fetched from repository APIs. Node & Gradle both have two lists. Node has Dependencies & Dev Dependencies. Gradle has Dependencies & Plugin Dependencies. At least one list will be present in each build system.

Dependency List has following columns which are common to Node & Gradle

| Column Name       | Purpose                                                           |
|-------------------|-------------------------------------------------------------------|
| Name              | Name of the dependency                                            |
| Current Version   | Version present in the current build file                         |
| Update Version    | Version which will be used in updated file                        |
| Updated           | Shows a check mark if a version was selected for that dependency to track progress |
| Details           | Each row has an expand icon, which can be clicked to see version details |

---`,
      test: () => {
        console.log('User Guide - Dependency List')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Dependency Versions',
      doc: `
### Dependency Versions
Version detail grid, displays 10 most relevant versions for that dependency. How the relevant versions are picked is detailed in **[user flows](/user-flows)**. Dependency versions have slight differences between build systems, as their repository API provide different attributes.

---`,
      test: () => {
        console.log('User Guide - Dependency Versions')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
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
      test: () => {
        console.log('User Guide - Dependency Versions Node')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
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
      test: () => {
        console.log('User Guide - Dependency Versions Gradle')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Dependency Version Selection',
      doc: `
#### Version Selection
After expanding dependency, a sub grid with relevant versions will be displayed. Select the radio button with desired version to initiate selection.
This version will be populated in the text box above grid, this is done to provide option for manual edits if required.
When selecting a new version, If the existing version had identifiable **[prefix*](/user-guide?id=version-prefix)**, it is automatically added to the new version. This is done as it is the most common way to describe versions in node. Example "@angular/cli": "^18.1.2", is updated to "@angular/cli": "^19.0.5". Version in text box will automatically apply '^' prefix to the new version.

Text Box can also be used to specify version for local dependencies manually. Click on select button after confirming the version is in text box, to complete version selection.
Sub grid will auto collapse on clicking select to speed up the process. Dependency will have update version populated in main grid 
and it will be marked with green check to track progress.

---`,
      test: () => {
        console.log('User Guide - Dependency Version Selection')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Dependency Version Prefix',
      doc: `
#### *Version Prefix
If version is in format \`\`\`[symbols][wordChars].[wordChars].[wordChars]\`\`\`, then symbols at the beginning are treated as prefix

---`,
      test: () => {
        console.log('User Guide - Dependency Version Prefix')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Output',
      doc: `
### Output
After making all the changes, click on copy button to copy updated build file to clipboard. Updated build file will have new versions for dependencies which were updated.
While no changes will be made to other part of build file. This can now be pasted to the build file in original source code.

---`,
      test: () => {
        console.log('User Guide - Output')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Settings',
      doc: `
## Settings
Settings allows you to specify color scheme, and CORS proxy Url.

---`,
      test: () => {
        console.log('User Guide - Settings')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    },
    {
      title: 'Settings Proxy Url',
      doc: `
### Proxy Url
API for gradle plugin dependencies does not allow CORS calls. Hence a CORS proxy is needed to make the API call. Following are the options to provide CORS proxy URL
- Preferred option is to run CORS proxy locally. See **[setup](/dev-guide?id=setup)** for details. After local server is up, \`\`\`http://localhost:3040/get?url=\`\`\` can be used as proxy URL.
- If the first method is not working for any reason, any other open source proxy can be deployed locally and its URL can be used. It should work with format proxyUrl+originalUrl.  
Example "https://github.com/Rob--W/cors-anywhere"
- Least preferred option is to use a public proxy, like \`\`\`https://api.allorigins.win/get?url=\`\`\`. This option will work, but its not very reliable, and it incurs cost to the provider hosting this service purely for test purpose.

---`,
      test: () => {
        console.log('User Guide - Settings Proxy Url')
        expect(userGuideDocTests.tests).to.be.not.empty;
      }
    }
  ]
}

runDocTests(userGuideDocTests);