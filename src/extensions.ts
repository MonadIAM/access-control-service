Object.typedEntries = function typedEntries<T extends object>(obj: T) {
    const keys = Object.keys(obj) as (keyof T)[];
    const result: { [K in keyof T]-?: [K, T[K]] }[keyof T][] = [];
    for (const key of keys) {
        result.push([key, obj[key]]);
    }
    return result;
};

Object.deepFreeze = function deepFreeze<T>(obj: T, visited = new WeakSet<object>()): DeepReadonly<T> {
    if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
        return obj as DeepReadonly<T>;
    } else if (visited.has(obj)) {
        return obj as DeepReadonly<T>;
    } else {
        visited.add(obj);
        for (const key of Reflect.ownKeys(obj)) {
            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
            if (descriptor && "value" in descriptor) {
                deepFreeze(descriptor.value, visited);
            }
        }
        return Object.freeze(obj) as DeepReadonly<T>;
    }
};
