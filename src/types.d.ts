type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Maybe<T> = T | undefined | null;

type Ordinal = number | string | Date;

type Class<T = unknown> = new (...args: unknown[]) => T;

type RequestContext = {
    userAgent: string;
    ip: string;
};

type MessageResult = {
    message: string;
    params?: Record<string, unknown>;
};

interface ObjectConstructor {
    typedEntries: <T extends object>(obj: T) => { [K in keyof T]-?: [K, T[K]] }[keyof T][];
}
