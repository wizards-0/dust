export class Settings{
    public readonly theme:string;
    public readonly updateCycle:number;
    public readonly corsProxy:string;
    constructor(theme?:string | undefined | null,updateCycle?:number | undefined | null,corsProxy?:string | undefined | null){
        this.theme = theme ?? 'light';
        this.updateCycle = updateCycle ?? 30;
        this.corsProxy = corsProxy ?? '';
    }
}