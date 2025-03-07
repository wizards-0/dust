## Quick Start
- Copy **package.json** or **build.gradle** or **settings.gradle** to clipboard from your source
- Paste it in the appropriate text box and click on check
- Click on expand arrow in right most column, to see versions for that dependency
- Select the desired version for each dependency from version detail grid
- Click on copy, paste updated file back to source

---

## Detailed Guide

### Build File Input
Currently, this tool supports Node & Gradle build files

---

#### Node
It is able to parse node's package.json for getting dependencies. Sections dependencies & dev dependencies are parsed. Others like peer dependencies are ignored.
They are not mandatory, but at least one of them should be present. 

Since this is a tool meant to be used by devs, and package.json will usually be copied from source, There are no validation on structure of json.
The only validation is that string itself is a valid json. So if in json, dependencies is an array instead of usual object, the tool will simply break.

For local packages that are not available in the npmjs registry, they will still be listed in the dependency grid, but will have an empty version detail grid.

---

#### Gradle
For gradle, you can paste build.gradle or settings.gradle. It is able to parse dev dependencies (api, impl, test, etc) and plugin dependencies for which you have to specify version.

In gradle there are lot of ways to write dependency version. But only two formats are currently parsable by this tool
- For dependencies, supported format is **{group}:{artifact}:{version}**
- For plugins, supported format is **id "{pluginName}" version"{version}"**

All the dependencies / plugins which are not in this format will be ignored. And dependencies in above format will be processed.

---

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

---

### Dependency Versions
Version detail grid, displays 10 most relevant versions along with latest for that dependency.
See **[Relevant Versions](/user-guide?id=relevant-versions)** for details.
Dependency versions have slight differences between build systems, as their repository API provide different attributes.

---

#### Node

| Column Name       | Purpose                                                           |
|-------------------|-------------------------------------------------------------------|
| Version           | Name of the dependency                                            |
| Downloads (7 days)| No. of times this version was downloaded from repo in last 7 days |
| Tags              | Tags associated with this version                                 |
| Publish Date      | Date when this version was published                              |

---

#### Gradle
| Column Name           | Purpose                                                           |
|-----------------------|-------------------------------------------------------------------|
| Version               | Name of the dependency                                            |
| Depended On           | No. of other dependencies that utilize this version               |
| Vulnerability Count   | Count of known vulnerabilities in OSS scan                        |
| Publish Date          | Date when this version was published                              |

---

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

---

#### *Version Prefix
If version is in format ```[symbols][wordChar][anything]```, then symbols at the beginning are treated as prefix

---

### Relevant Versions
Download stats is used to figure out relevant versions. Top 10 downloaded versions along with last updated version and version with "latest" tag if present are selected.
For calculating both top 10 downloads and latest version, **[Version Filter](/user-guide?id=version-filter)** is taken into consideration.
Versions having filter keyword in them will be filtered first, then rest of the operations will be performed. Namely figuring out top 10 and latest.
Number of versions are restricted to remove clutter. Most of the time desired version will be present in Top 10 most downloaded versions.

---

### Multi Update
This can update multiple dependencies to latest version. By default, this will apply latest version to selected dependencies.
If latest version is very new / unstable, 2nd 3rd or 4th latest version can be selected from dropdown.
If unwanted versions are showing up as latest, **[Version Filter](/user-guide?id=version-filter)** can be utilized to exclude them.
If no dependencies are selected, this operation will do nothing

---

### Output
After making all the changes, click on copy button to copy updated build file to clipboard. Updated build file will have new versions for dependencies which were updated.
While no changes will be made to other part of build file. This can now be pasted to the build file in original source code.

---

## Settings
Settings allows you to specify color scheme, CORS proxy Url and Version Filter.

---

### Proxy Url
API for gradle plugin dependencies does not allow CORS calls. Hence a CORS proxy is needed to make the API call.
Following are the options to provide CORS proxy URL
- Preferred option is to run CORS proxy locally. See **[setup](/dev-guide?id=setup)** for details.
After local server is up, ```http://localhost:3040/get?url=``` can be used as proxy URL.
- If the first method is not working for any reason, any other open source proxy can be deployed locally and its URL can be used.
It should work with format proxyUrl+originalUrl.  
Example "https://github.com/Rob--W/cors-anywhere"
- Least preferred option is to use a public proxy, like ```https://api.allorigins.win/get?url=```.
This option will work, but its not very reliable, and it incurs cost to the provider hosting this service purely for test purpose.

---

### Version Filter
Version filter allows you to specify keywords for excluding versions.Filter is used to perform a contains check and not an exact match.
So all versions, having any of the filter strings in them will be excluded from version details grid.
This feature is mostly useful when you want to keep dependencies at latest version, but do not want to use beta versions.
This can ensure the top version is a stable one, allowing you to bulk select latest version for all dependencies.
Also the tracker column indicating if the dependency is on latest version becomes more useful.

---