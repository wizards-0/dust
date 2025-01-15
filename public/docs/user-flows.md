## User Flows
This section provides detailed sequence of steps for both user and application process

### Common Flow
1. User pastes content of build file to text area & clicks check
2. Basic validation is performed. If it is invalid, an error message is shown. Else the process continues
3. Application parses build file & creates a list of dependencies having name & current version
4. For each dependency data is fetched from repository API 
5. Download stats is used to figure out relevant versions. Top 10 downloaded versions & version with "latest" tag if present are selected.
Number of versions are restricted to remove clutter. Most of the time desired version will be present in Top 10 most downloaded versions.
For exceptions version can be provided manually
6. Data from APIs is reduced to list of dependencies, with following attributes
    - Dependency
        - Name
        - Current Version
        - Versions
            - Version
            - Downloads
            - Tags
            - Publish Date
    - After parsing & fetching details. If dependency lists are empty, then Invalid build file error is shown to user.
7. User, expands dependency to select a new version
8. A sub grid, with version for that dependency is presented. If current version excluding [prefix*](/user-guide?id=version-prefix) matches any version in grid, it is pre-selected.
Current Version is also populated in version selection text box.
9. User selects a new version from the sub gird, See [Version Selection*](/user-guide?id=version-selection) for details
10. User performs steps 7-9 to for all dependencies that needs update.
11. User clicks on Copy in build file section, to copy updated build file to clipboard. Updated build file is pasted back to source code.

### Node JS
Following steps are specific to Node JS 
1. package.json is the supported build file.
2. Basic JSON format validation is performed. If it is invalid, an error message is shown. Else the process continues
3. For each dependency following data is fetched from npmjs API 
    1. Download stats are fetched from "https://api.npmjs.org/versions/${packageName}/last-week"
    2. Tags, Publish time for versions is fetched from https://registry.npmjs.org/${packageName}
4. Two grids are shown. One for Dependencies, second for Dev Dependencies.
5. Along with top 10 downloaded versions, version with "latest" tag if present is also included.

### Gradle
Following steps are specific to gradle
1. Both build.gradle or settings.gradle can be used
2. For gradle build files instead of porting tooling to node runtime, A regex based parser is implemented to get list of dependencies.
Following is the parsing process for gradle build files
    1. File is read line by line, and indices for sections is calculated aggregated in GradleFileParts.  
    Line index for determining start of dependencies section is determined by "dependencies \{" or "dependencyResolutionManagement \{"  
    Line index for determining start of plugin section is determined by "plugins \{"  
    Line index for section end is determined by the last closing "\}"  
    As seen above, if build files do not follow convention and have braces on next line, parsing will fail for those
    2. Similarly version can be specified in a lot of ways in gradle file, but only the most commonly used format ```group:artifact:version``` is supported.
    For Plugins supported format is ```id "pluginName" version "version"```. There can still be dependencies & plugins having version specified in other formats,
    they will simply be ignored and only dependencies in above format will be parsed.
3. For dependencies data is fetched from "https://central.sonatype.com/api/internal/browse/component/versions?sortField=normalizedVersion&sortDirection=desc&page=0&size=10&filter=namespace:${group},name:${artifact}". This API does not provide download stats for versions. Instead it has "dependedOn" attribute to specify how many other artifacts
use that specific version. Since it serves a similar purpose it is mapped to downloads for figuring out relevant versions. It also doesn't have tags, and provides
vulnerability count. Hence the reason for difference in columns
4. For plugins data is fetched from "https://plugins.gradle.org/m2/${pluginPath}/maven-metadata.xml". Unfortunately this API provides very limited data, it only has list of version
and publish time for latest version, So relevant versions are just calculated based on alphabetical sorting of versions. Also this API does not support CORS, hence a CORS proxy
is required for this API to work. See [Proxy Url*](/user-guide?id=proxy-url) for more details