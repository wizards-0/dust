## User Flows
This section provides detailed sequence of steps for both user and application process

### Node JS
1. User pastes content of package.json to node text area & clicks check
2. Basic JSON format validation is performed. If it is invalid, an error message is shown. Else the process continues
3. Application parses package.json & creates a list of dependencies having name & current version
4. For each dependency following data is fetched from npmjs API 
    1. Download stats are fetched from "https://api.npmjs.org/versions/${packageName}/last-week"
    2. Tags, Publish time for versions is fetched from https://registry.npmjs.org/${packageName}
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
    - After parsing & fetching details. If both dependencies & devDependencies list are empty, then Invalid json error is shown to user.
7. User, expands dependency to select a new version
8. A sub grid, with version for that dependency is presented. If current version excluding [prefix*](/user-guide?id=version-prefix) matches any version in grid, it is pre-selected.
Current Version is also populated in version selection text box.
9. User selects a new version from the sub gird, See [Version Selection*](/user-guide?id=version-selection) for details
10. User performs steps 7-9 to for all dependencies that needs update.
11. User clicks on Copy in build file section, to copy updated build file to clipboard. Updated build file is pasted back to source code.

### Gradle
1. User pastes content of build.gradle or settings.gradle to gradle text area & clicks check
2. 