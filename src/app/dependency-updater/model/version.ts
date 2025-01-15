import {ValueObject,hash} from 'immutable';

export class Version implements ValueObject {

    public readonly version:string;
    public readonly downloads:number;
    public readonly relativeDownloads:number;
    public readonly tag:string;
    public readonly vulnerabilityCount:number;
    public readonly publishDate:number;

    constructor(
        version:string,
        downloads:number,
        relativeDownloads:number,
        tag:string,
        vulnerabilityCount:number,
        publishDate:number
    ) {
        this.version = version ?? '';
        this.downloads = downloads ?? -1;
        this.relativeDownloads = relativeDownloads ?? 0;
        this.tag = tag ?? '';
        this.vulnerabilityCount = vulnerabilityCount ?? -1;
        this.publishDate = publishDate ?? -1;
    }

    public static  builder():VersionBuilder {
        return new VersionBuilder();
    }

    public static  empty():Version {
        return Version.builder()
            .version('')
            .downloads(-1)
            .relativeDownloads(0)
            .tag('')
            .vulnerabilityCount(-1)
            .publishDate(-1)
        .build();
    }

    public static fromRaw(raw:any):Version {
        const version:string = raw.version;
        const downloads:number = raw.downloads;
        const relativeDownloads:number = raw.relativeDownloads;
        const tag:string = raw.tag;
        const vulnerabilityCount:number = raw.vulnerabilityCount;
        const publishDate:number = raw.publishDate;

        return new Version(
            version,
            downloads,
            relativeDownloads,
            tag,
            vulnerabilityCount,
            publishDate
        );
    }

    public toBuilder():VersionBuilder {
        const builder = new VersionBuilder();
        builder.version(this.version);
        builder.downloads(this.downloads);
        builder.relativeDownloads(this.relativeDownloads);
        builder.tag(this.tag);
        builder.vulnerabilityCount(this.vulnerabilityCount);
        builder.publishDate(this.publishDate);
        return builder;
    }

    public with(mutator:(builder:VersionBuilder)=>void):Version {
        const builder = this.toBuilder();
        mutator(builder);
        return builder.build();
    }

    public equals(o:any):boolean {
        if(o == null || o == undefined || typeof this !== typeof o) return false;
        const that:Version = o;
        return true &&
            this.version === that.version
            &&
            this.downloads === that.downloads
            &&
            this.relativeDownloads === that.relativeDownloads
            &&
            this.tag === that.tag
            &&
            this.vulnerabilityCount === that.vulnerabilityCount
            &&
            this.publishDate === that.publishDate
            ;
    }

    public hashCode(): number {
        return hash(JSON.stringify([
            this.version,
            this.downloads,
            this.relativeDownloads,
            this.tag,
            this.vulnerabilityCount,
            this.publishDate
        ]));
    }
}

export class VersionBuilder {
    private _version:string = '';
    private _downloads:number = -1;
    private _relativeDownloads:number = 0;
    private _tag:string = '';
    private _vulnerabilityCount:number = -1;
    private _publishDate:number = -1;

    public build():Version {
        return new Version(
            this._version,
            this._downloads,
            this._relativeDownloads,
            this._tag,
            this._vulnerabilityCount,
            this._publishDate
        );
    }

    public version(version:string):VersionBuilder {
        this._version = version;
        return this;
    }
    public downloads(downloads:number):VersionBuilder {
        this._downloads = downloads;
        return this;
    }
    public relativeDownloads(relativeDownloads:number):VersionBuilder {
        this._relativeDownloads = relativeDownloads;
        return this;
    }
    public tag(tag:string):VersionBuilder {
        this._tag = tag;
        return this;
    }
    public vulnerabilityCount(vulnerabilityCount:number):VersionBuilder {
        this._vulnerabilityCount = vulnerabilityCount;
        return this;
    }
    public publishDate(publishDate:number):VersionBuilder {
        this._publishDate = publishDate;
        return this;
    }
}