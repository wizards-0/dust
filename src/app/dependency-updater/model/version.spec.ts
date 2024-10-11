
import {Version} from './version';


describe('Version', () => {
    it('should be creatable from json', () => {
        const emptyObject1 = Version.fromRaw(JSON.parse(JSON.stringify(
            Version.empty().with(v => {}).toBuilder().build())));
        const emptyObject2 = Version.builder()
                            .version('')
                            .downloads(-1)
                            .relativeDownloads(0)
                            .tag('')
                            .vulnerabilityCount(0)
                            .publishDate(-1)
                            .build();
        expect(emptyObject1.equals(emptyObject2)).toBeTrue();
        const randomValue = getRandomVersion();
        const randomValueClone = Version.fromRaw(JSON.parse(JSON.stringify(randomValue)));
        expect(randomValue.equals(randomValueClone)).toBeTrue();
        expect(randomValue.hashCode()).toBe(randomValueClone.hashCode());
    });

    it('should be able to compare same type objects', () => {
        let o:Version = Version.empty();
        expect(o.equals(o)).toBeTrue();
        expect(o.equals({} as any)).toBeFalse();
        expect(o.equals(undefined as any)).toBeFalse();
        expect(o.equals(null as any)).toBeFalse();

        let o1:Version;
        let o2:Version;

        o1 = Version.empty().toBuilder().version(Math.random()+'').build();
        o2 = Version.empty().toBuilder().version(Math.random()+'').build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Version.empty().toBuilder().downloads(Math.round(Math.random() * 10000)).build();
        o2 = Version.empty().toBuilder().downloads(Math.round(Math.random() * 10000)).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Version.empty().toBuilder().relativeDownloads(Math.round(Math.random() * 10000)).build();
        o2 = Version.empty().toBuilder().relativeDownloads(Math.round(Math.random() * 10000)).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Version.empty().toBuilder().tag(Math.random()+'').build();
        o2 = Version.empty().toBuilder().tag(Math.random()+'').build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Version.empty().toBuilder().vulnerabilityCount(Math.round(Math.random() * 10000)).build();
        o2 = Version.empty().toBuilder().vulnerabilityCount(Math.round(Math.random() * 10000)).build();
        expect(o1.equals(o2)).toBeFalse();
        o1 = Version.empty().toBuilder().publishDate(Math.round(Math.random() * 10000)).build();
        o2 = Version.empty().toBuilder().publishDate(Math.round(Math.random() * 10000)).build();
        expect(o1.equals(o2)).toBeFalse();
    });
});

export function getRandomVersion():Version {
    return Version.builder()
        .version(Math.random()+'')
        .downloads(Math.round(Math.random() * 10000))
        .relativeDownloads(Math.round(Math.random() * 10000))
        .tag(Math.random()+'')
        .vulnerabilityCount(Math.round(Math.random() * 10000))
        .publishDate(Math.round(Math.random() * 10000))
    .build();
}