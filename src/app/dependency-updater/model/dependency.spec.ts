
import {Dependency} from './dependency';

import {List} from 'immutable';
import {Version} from './version';
import {getRandomVersion} from './version.spec';

describe('Dependency', () => {
    it('should be creatable from json', () => {
        const emptyObject1 = Dependency.fromRaw(JSON.parse(JSON.stringify(
            Dependency.empty().with(v => {}).toBuilder().build())));
        const emptyObject2 = Dependency.builder()
                            .name('')
                            .currentVersion('')
                            .updateVersion('')
                            .isUpToDate(false)
                            .versions(List())
                            .build();
        expect(emptyObject1.equals(emptyObject2)).toBeTrue();
        const randomValue = getRandomDependency();
        const randomValueClone = Dependency.fromRaw(JSON.parse(JSON.stringify(randomValue)));
        expect(randomValue.equals(randomValueClone)).toBeTrue();
        expect(randomValue.hashCode()).toBe(randomValueClone.hashCode());
        expect(Dependency.fromRaw({})).toEqual(Dependency.empty());
        expect(new Dependency(undefined as any,undefined as any,undefined as any,undefined as any,undefined as any)).toEqual(Dependency.empty());
    });

    it('should be able to compare same type objects', () => {
        let o:Dependency = Dependency.empty();
        expect(o.equals(o)).toBeTrue();
        expect(o.equals({} as any)).toBeFalse();
        expect(o.equals(undefined as any)).toBeFalse();
        expect(o.equals(null as any)).toBeFalse();

        let o1:Dependency;
        let o2:Dependency;

        o1 = Dependency.empty().toBuilder().name(Math.random()+'').build();
        o2 = Dependency.empty().toBuilder().name(Math.random()+'').build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().currentVersion(Math.random()+'').build();
        o2 = Dependency.empty().toBuilder().currentVersion(Math.random()+'').build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().updateVersion(Math.random()+'').build();
        o2 = Dependency.empty().toBuilder().updateVersion(Math.random()+'').build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().isUpToDate(true).build();
        o2 = Dependency.empty().toBuilder().isUpToDate(false).build();
        expect(o1.equals(o2)).toBeFalse();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().versions(List([getRandomVersion()])).build();
        o2 = Dependency.empty().toBuilder().versions(List([getRandomVersion()])).build();
        expect(o1.equals(o2)).toBeFalse();
    });
});

export function getRandomDependency():Dependency {
    return Dependency.builder()
        .name(Math.random()+'')
        .currentVersion(Math.random()+'')
        .updateVersion(Math.random()+'')
        .isUpToDate(( Math.round(Math.random() * 10000) ) % 2 == 0)
        .versions(List([getRandomVersion()]))
    .build();
}