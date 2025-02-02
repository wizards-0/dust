import {ValueObject,hash} from 'immutable';
import {equals} from 'ace-common-util';
import {List} from 'immutable';
import {Version} from './version';

export class Dependency implements ValueObject {

    public readonly name:string;
    public readonly currentVersion:string;
    public readonly updateVersion:string;
    public readonly isSelected:boolean;
    public readonly isUpdated:boolean;
    public readonly isLatest:boolean;
    public readonly versions:List<Version>;

    constructor(
        name:string,
        currentVersion:string,
        updateVersion:string,
        isSelected:boolean,
        isUpdated:boolean,
        isLatest:boolean,
        versions:List<Version>
    ) {
        this.name = name ?? '';
        this.currentVersion = currentVersion ?? '';
        this.updateVersion = updateVersion ?? '';
        this.isSelected = isSelected ?? false;
        this.isUpdated = isUpdated ?? false;
        this.isLatest = isLatest ?? false;
        this.versions = versions ?? List();
    }

    public static  builder():DependencyBuilder {
        return new DependencyBuilder();
    }

    public static  empty():Dependency {
        return Dependency.builder()
            .name('')
            .currentVersion('')
            .updateVersion('')
            .isSelected(false)
            .isUpdated(false)
            .isLatest(false)
            .versions(List())
        .build();
    }

    public static fromRaw(raw:any):Dependency {
        const name:string = raw.name;
        const currentVersion:string = raw.currentVersion;
        const updateVersion:string = raw.updateVersion;
        const isSelected:boolean = raw.isSelected;
        const isUpdated:boolean = raw.isUpdated;
        const isLatest:boolean = raw.isLatest;
        const versions:List<Version> = !!raw.versions ? List(raw.versions.map( (item:any) => Version.fromRaw(item))) : List();

        return new Dependency(
            name,
            currentVersion,
            updateVersion,
            isSelected,
            isUpdated,
            isLatest,
            versions
        );
    }

    public toBuilder():DependencyBuilder {
        const builder = new DependencyBuilder();
        builder.name(this.name);
        builder.currentVersion(this.currentVersion);
        builder.updateVersion(this.updateVersion);
        builder.isSelected(this.isSelected);
        builder.isUpdated(this.isUpdated);
        builder.isLatest(this.isLatest);
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
            this.isSelected === that.isSelected
            &&
            this.isUpdated === that.isUpdated
            &&
            this.isLatest === that.isLatest
            &&
            equals(this.versions,that.versions)
            ;
    }

    public hashCode(): number {
        return hash(JSON.stringify([
            this.name,
            this.currentVersion,
            this.updateVersion,
            this.isSelected,
            this.isUpdated,
            this.isLatest,
            this.versions
        ]));
    }
}

export class DependencyBuilder {
    private _name:string = '';
    private _currentVersion:string = '';
    private _updateVersion:string = '';
    private _isSelected:boolean = false;
    private _isUpdated:boolean = false;
    private _isLatest:boolean = false;
    private _versions:List<Version> = List();

    public build():Dependency {
        return new Dependency(
            this._name,
            this._currentVersion,
            this._updateVersion,
            this._isSelected,
            this._isUpdated,
            this._isLatest,
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
    public isSelected(isSelected:boolean):DependencyBuilder {
        this._isSelected = isSelected;
        return this;
    }
    public isUpdated(isUpdated:boolean):DependencyBuilder {
        this._isUpdated = isUpdated;
        return this;
    }
    public isLatest(isLatest:boolean):DependencyBuilder {
        this._isLatest = isLatest;
        return this;
    }
    public versions(versions:List<Version>):DependencyBuilder {
        this._versions = versions;
        return this;
    }
}