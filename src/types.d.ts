type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Maybe<T> = T | undefined | null;

interface ObjectConstructor {
    typedEntries: <T extends object>(obj: T) => { [K in keyof T]-?: [K, T[K]] }[keyof T][];
}
