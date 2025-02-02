
import {Dependency} from './dependency';

import {List} from 'immutable';
import {getRandomVersion} from './version.spec';

describe('Dependency', () => {
    it('should be creatable from json', () => {
        const emptyObject1 = Dependency.fromRaw(JSON.parse(JSON.stringify(
            Dependency.empty().with(v => {}).toBuilder().build())));
        const emptyObject2 = Dependency.builder()
                            .name('')
                            .currentVersion('')
                            .updateVersion('')
                            .isSelected(false)
                            .isUpdated(false)
                            .isLatest(false)
                            .versions(List())
                            .build();
        expect(emptyObject1.equals(emptyObject2)).toBeTrue();
        const randomValue = getRandomDependency();
        const randomValueClone = Dependency.fromRaw(JSON.parse(JSON.stringify(randomValue)));
        expect(randomValue.equals(randomValueClone)).toBeTrue();
        expect(randomValue.hashCode()).toBe(randomValueClone.hashCode());
        expect(Dependency.fromRaw({})).toEqual(Dependency.empty());
        expect(new Dependency(undefined as any,undefined as any,undefined as any,undefined as any,undefined as any,undefined as any,undefined as any)).toEqual(Dependency.empty());
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
        o1 = Dependency.empty().toBuilder().isSelected(true).build();
        o2 = Dependency.empty().toBuilder().isSelected(false).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().isUpdated(true).build();
        o2 = Dependency.empty().toBuilder().isUpdated(false).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().isLatest(true).build();
        o2 = Dependency.empty().toBuilder().isLatest(false).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Dependency.empty().toBuilder().versions(List([getRandomVersion()])).build();
        o2 = Dependency.empty().toBuilder().versions(List([getRandomVersion()])).build();
        expect(o1.equals(o2)).toBeFalse();
    });
});

let isEven = false;
export function getRandomDependency():Dependency {
    isEven = !isEven;
    return Dependency.builder()
        .name(Math.random()+'')
        .currentVersion(Math.random()+'')
        .updateVersion(Math.random()+'')
        .isSelected(isEven)
        .isUpdated(isEven)
        .isLatest(isEven)
        .versions(List([getRandomVersion()]))
    .build();
}