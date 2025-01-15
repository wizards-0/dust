export class Settings{
    public readonly theme:string;
    public readonly corsProxy:string;
    constructor(theme?:string | undefined | null,corsProxy?:string | undefined | null){
        this.theme = theme ?? 'light';
        this.corsProxy = corsProxy ?? '';
    }
}