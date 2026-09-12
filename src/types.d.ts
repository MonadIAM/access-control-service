// Intentional any[]: required by TS2545 for mixin constructor rest parameters.
// Do not replace with unknown[], it breaks TypeScript mixin compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArray = any[];

type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Thenable<T> = Promise<T> | T;

type Maybe<T> = T | undefined | null;

type Ordinal = number | string | Date;

type Class<T = {}> = new (...args: AnyArray) => T;

type UnknownObject = Record<string, unknown>;

type DeepReadonly<T> = T extends (...args: AnyArray) => unknown
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

interface ObjectConstructor {
    typedEntries<T extends object>(obj: T): { [K in keyof T]-?: [K, T[K]] }[keyof T][];
    deepFreeze<T>(obj: T): DeepReadonly<T>;
}
