import {ValueObject,hash} from 'immutable';
import {equals,withDefault} from 'ace-common-util';
import {List} from 'immutable';
import {Version} from './version';

export class Dependency implements ValueObject {

    public readonly name:string;
    public readonly currentVersion:string;
    public readonly updateVersion:string;
    public readonly isUpToDate:boolean;
    public readonly updatedOn:number;
    public readonly versions:List<Version>;

    constructor(
        name:string,
        currentVersion:string,
        updateVersion:string,
        isUpToDate:boolean,
        updatedOn:number,
        versions:List<Version>
    ) {
        this.name = withDefault(name,'');
        this.currentVersion = withDefault(currentVersion,'');
        this.updateVersion = withDefault(updateVersion,'');
        this.isUpToDate = withDefault(isUpToDate,false);
        this.updatedOn = withDefault(updatedOn,0);
        this.versions = withDefault(versions,List());
    }

    public static  builder():DependencyBuilder {
        return new DependencyBuilder();
    }

    public static  empty():Dependency {
        return Dependency.builder()
            .name('')
            .currentVersion('')
            .updateVersion('')
            .isUpToDate(false)
            .updatedOn(0)
            .versions(List())
        .build();
    }

    public static fromRaw(raw:any):Dependency {
        const name:string = raw.name;
        const currentVersion:string = raw.currentVersion;
        const updateVersion:string = raw.updateVersion;
        const isUpToDate:boolean = raw.isUpToDate;
        const updatedOn:number = raw.updatedOn;
        const versions:List<Version> = !!raw.versions ? List(raw.versions.map( (item:any) => Version.fromRaw(item))) : List();

        return new Dependency(
            name,
            currentVersion,
            updateVersion,
            isUpToDate,
            updatedOn,
            versions
        );
    }

    public toBuilder():DependencyBuilder {
        const builder = new DependencyBuilder();
        builder.name(this.name);
        builder.currentVersion(this.currentVersion);
        builder.updateVersion(this.updateVersion);
        builder.isUpToDate(this.isUpToDate);
        builder.updatedOn(this.updatedOn);
        builder.versions(this.versions);
        return builder;
    }

    public with(mutator:(builder:DependencyBuilder)=>void):Dependency {
        const builder = this.toBuilder();
        mutator(builder);
        return builder.build();
    }

    public equals(o:any):boolean {
        if(o == null || o == undefined || typeof this !== typeof o) return false;
        const that:Dependency = o;
        return true &&
            this.name === that.name
            &&
            this.currentVersion === that.currentVersion
            &&
            this.updateVersion === that.updateVersion
            &&
            this.isUpToDate === that.isUpToDate
            &&
            this.updatedOn === that.updatedOn
            &&
            equals(this.versions,that.versions)
            ;
    }

    public hashCode(): number {
        return hash(JSON.stringify([
            this.name,
            this.currentVersion,
            this.updateVersion,
            this.isUpToDate,
            this.updatedOn,
            this.versions
        ]));
    }
}

export class DependencyBuilder {
    private _name:string = '';
    private _currentVersion:string = '';
    private _updateVersion:string = '';
    private _isUpToDate:boolean = false;
    private _updatedOn:number = 0;
    private _versions:List<Version> = List();

    public build():Dependency {
        return new Dependency(
            this._name,
            this._currentVersion,
            this._updateVersion,
            this._isUpToDate,
            this._updatedOn,
            this._versions
        );
    }

    public name(name:string):DependencyBuilder {
        this._name = name;
        return this;
    }
    public currentVersion(currentVersion:string):DependencyBuilder {
        this._currentVersion = currentVersion;
        return this;
    }
    public updateVersion(updateVersion:string):DependencyBuilder {
        this._updateVersion = updateVersion;
        return this;
    }
    public isUpToDate(isUpToDate:boolean):DependencyBuilder {
        this._isUpToDate = isUpToDate;
        return this;
    }
    public updatedOn(updatedOn:number):DependencyBuilder {
        this._updatedOn = updatedOn;
        return this;
    }
    public versions(versions:List<Version>):DependencyBuilder {
        this._versions = versions;
        return this;
    }
}