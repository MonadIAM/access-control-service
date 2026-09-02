import type { I18nTranslations } from "./intl.generated";

declare global {
    namespace Intl {
        type LeafPath<T> = {
            [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown> ? `${K}.${LeafPath<T[K]>}` : K;
        }[Extract<keyof T, string>];

        type Key = LeafPath<I18nTranslations>;

        type ValidatorKey = Extract<keyof I18nTranslations["validator"], string>;
    }
}
