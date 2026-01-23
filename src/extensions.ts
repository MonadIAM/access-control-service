Object.typedEntries = function typedEntries<T extends object>(obj: T) {
    const keys = Object.keys(obj) as (keyof T)[];
    const result: { [K in keyof T]-?: [K, T[K]] }[keyof T][] = [];
    for (const key of keys) {
        result.push([key, obj[key]]);
    }
    return result;
};
