type AnyArray = any[];

type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Maybe<T> = T | undefined | null;

type Ordinal = number | string | Date;

type Class<T = {}> = new (...args: AnyArray) => T;

type UnknownObject = Record<string, unknown>;

interface ObjectConstructor {
    typedEntries: <T extends object>(obj: T) => { [K in keyof T]-?: [K, T[K]] }[keyof T][];
}
