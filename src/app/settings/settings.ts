import { List } from "immutable";

export class Settings{
    public readonly settingsVersion:number;
    public readonly theme:string;
    public readonly corsProxy:string;
    public readonly versionBlackList:List<string>;
    constructor(
        settingsVersion:number,
        theme:string,
        corsProxy:string,
        versionBlackList:List<string>
    ){
        this.settingsVersion = settingsVersion;
        this.theme = theme;
        this.corsProxy = corsProxy;
        this.versionBlackList = versionBlackList;
    }
}