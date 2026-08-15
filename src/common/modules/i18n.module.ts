import { Module } from "@nestjs/common";
import { join } from "path";
import {
    I18nModule as InitI18nModule,
    AcceptLanguageResolver,
    HeaderResolver,
    I18nJsonLoader,
    QueryResolver,
} from "nestjs-i18n";

@Module({
    imports: [
        InitI18nModule.forRoot({
            fallbackLanguage: "en",
            loader: I18nJsonLoader,
            loaderOptions: {
                path: join(__dirname, "../dictionaries/"),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ["lang", "locale"] },
                new HeaderResolver(["x-locale"]),
                AcceptLanguageResolver,
            ],
        }),
    ],
})
export class I18nModule {}
