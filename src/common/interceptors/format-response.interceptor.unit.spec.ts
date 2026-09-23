import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { I18nService, TranslateOptions } from "nestjs-i18n";
import { describe, expect, it, jest } from "@jest/globals";
import { lastValueFrom, of, throwError } from "rxjs";
import { Expose, Type } from "class-transformer";
import { Reflector } from "@nestjs/core";

import { FORMAT_RESPONSE_DTO, SKIP_INTERCEPTORS } from "~common/decorators";

import { FormatResponseInterceptor } from "./format-response.interceptor";

class ItemDTO {
    @Expose()
    public id!: number;

    @Expose()
    public message?: string;
}

class MetaDTO {
    @Expose()
    public totalPages!: number;

    @Expose()
    public elementsPerPage!: number;

    @Expose()
    public currentPage!: number;

    @Expose()
    public totalElements!: number;
}

class PageDTO {
    @Expose()
    @Type(() => ItemDTO)
    public data!: ItemDTO[];

    @Expose()
    @Type(() => MetaDTO)
    public meta!: MetaDTO;
}

function setup(options: { dto?: Class; body?: unknown; lang?: string; skipClass?: boolean; skipHandler?: boolean } = {}): {
    run(data: unknown): Promise<unknown>;
    translate: ReturnType<typeof jest.fn<(key: string, options?: TranslateOptions) => Promise<string>>>;
    interceptor: FormatResponseInterceptor;
    context: ExecutionContextHost;
} {
    class Controller {}
    const handler = (): undefined => {};

    if (options.dto) {
        Reflect.defineMetadata(FORMAT_RESPONSE_DTO, options.dto, handler);
    }
    if (options.skipClass !== undefined) {
        Reflect.defineMetadata(SKIP_INTERCEPTORS, options.skipClass, Controller);
    }
    if (options.skipHandler !== undefined) {
        Reflect.defineMetadata(SKIP_INTERCEPTORS, options.skipHandler, handler);
    }
    const request = {
        body: options.body,
        ...(options.lang ? { i18nContext: { lang: options.lang } } : {}),
    };
    const context = new ExecutionContextHost([request], Controller, handler);
    const translate = jest
        .fn<(key: string, options?: TranslateOptions) => Promise<string>>()
        .mockResolvedValue("Translated");
    const interceptor = new FormatResponseInterceptor(new Reflector(), { translate } as unknown as I18nService);
    const run = (data: unknown): Promise<unknown> =>
        lastValueFrom(interceptor.intercept(context, { handle: () => of(data) }));
    return { run, translate, interceptor, context };
}

describe("FormatResponseInterceptor", () => {
    it("passes the original stream through when no response DTO is configured", () => {
        const { interceptor, context, translate } = setup();
        const stream = of(null);
        const handle = jest.fn(() => stream);

        const result = interceptor.intercept(context, { handle });

        expect(result).toBe(stream);
        expect(handle).toHaveBeenCalledTimes(1);
        expect(translate).not.toHaveBeenCalled();
    });

    it.each([{ skipClass: true }, { skipHandler: true }])("honors skip metadata %j", async (skip) => {
        const { run, translate } = setup({ dto: ItemDTO, ...skip });
        const original = { id: "42", private: "retained", message: "message.KEY" };

        const result = await run(original);

        expect(result).toBe(original);
        expect(translate).not.toHaveBeenCalled();
    });

    it("lets method metadata override the class skip flag", async () => {
        const { run } = setup({ dto: ItemDTO, skipClass: true, skipHandler: false });

        const result = await run({ id: "42", private: "secret" });

        expect(result).toEqual({ id: 42, message: undefined });
    });

    it("converts to the DTO and strips fields outside the public contract", async () => {
        const { run, translate } = setup({ dto: ItemDTO });

        const result = await run({ id: "42", private: "secret", params: { secret: "hidden" } });

        expect(result).toBeInstanceOf(ItemDTO);
        expect(result).toEqual({ id: 42, message: undefined });
        expect(translate).not.toHaveBeenCalled();
    });

    it("awaits message translation with the request language and arguments", async () => {
        const { run, translate } = setup({ dto: ItemDTO, lang: "ru" });

        const result = await run({ id: 1, message: "message.KEY", params: { name: "Alex" } });

        expect(result).toEqual({
            id: 1,
            message: "Translated",
        });
        expect(translate).toHaveBeenCalledWith("message.KEY", {
            defaultValue: "message.KEY",
            args: { name: "Alex" },
            lang: "ru",
        });
    });

    it("uses empty translation arguments when params and language are absent", async () => {
        const { run, translate } = setup({ dto: ItemDTO });

        await run({ id: 1, message: "message.KEY" });

        expect(translate).toHaveBeenCalledWith("message.KEY", {
            defaultValue: "message.KEY",
            args: {},
            lang: undefined,
        });
    });

    it("does not translate non-string message values", async () => {
        const { run, translate } = setup({ dto: ItemDTO });

        await run({ id: 1, message: 123 });

        expect(translate).not.toHaveBeenCalled();
    });

    it("formats a count tuple with requested pagination and rounds page count up", async () => {
        const { run } = setup({ dto: PageDTO, body: { pagination: { currentPage: 2, elementsPerPage: 10 } } });

        const result = await run([[{ id: "11", private: "secret" }], 21]);

        expect(result).toBeInstanceOf(PageDTO);
        expect(result).toEqual({
            data: [{ id: 11, message: undefined }],
            meta: { totalPages: 3, elementsPerPage: 10, currentPage: 2, totalElements: 21 },
        });
        expect((result as PageDTO).data[0]).toBeInstanceOf(ItemDTO);
        expect((result as PageDTO).meta).toBeInstanceOf(MetaDTO);
    });

    it("formats a count tuple as one page when pagination is absent", async () => {
        const { run } = setup({ dto: PageDTO, body: {} });

        const result = await run([[{ id: 1 }], 5]);

        expect(result).toEqual({
            data: [{ id: 1, message: undefined }],
            meta: { totalPages: 1, elementsPerPage: 5, currentPage: 1, totalElements: 5 },
        });
    });

    it("returns zero pages for an empty paginated result", async () => {
        const { run } = setup({ dto: PageDTO, body: { pagination: { currentPage: 1, elementsPerPage: 10 } } });

        const result = await run([[], 0]);

        expect(result).toEqual({
            data: [],
            meta: { totalPages: 0, elementsPerPage: 10, currentPage: 1, totalElements: 0 },
        });
    });

    it("does not mistake an ordinary array of objects for a count tuple", async () => {
        const { run } = setup({ dto: ItemDTO });

        const result = await run([{ id: "1" }, { id: "2" }]);

        expect(result).toEqual([
            { id: 1, message: undefined },
            { id: 2, message: undefined },
        ]);
    });

    it("uses zero total when pagination is supplied without a count tuple", async () => {
        const { run } = setup({ dto: PageDTO, body: { pagination: { currentPage: 1, elementsPerPage: 10 } } });

        const result = await run([]);

        expect(result).toEqual({
            data: [],
            meta: { totalPages: 0, elementsPerPage: 10, currentPage: 1, totalElements: 0 },
        });
    });

    it("propagates the original handler error", async () => {
        const { interceptor, context, translate } = setup({ dto: ItemDTO });
        const error = new Error("handler failed");

        await expect(lastValueFrom(interceptor.intercept(context, { handle: () => throwError(() => error) }))).rejects.toBe(
            error,
        );
        expect(translate).not.toHaveBeenCalled();
    });

    it("propagates translation failures through the observable", async () => {
        const { run, translate } = setup({ dto: ItemDTO });
        const error = new Error("translation failed");
        translate.mockRejectedValueOnce(error);

        await expect(run({ message: "message.KEY" })).rejects.toBe(error);
    });
});
