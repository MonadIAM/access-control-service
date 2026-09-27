import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MikroORM } from "@mikro-orm/postgresql";
import * as fsPromises from "node:fs/promises";
import { Logger } from "@nestjs/common";
import * as fs from "node:fs";

import { CredentialsWatcher as Watcher } from "./credentials-watcher";

const readFile = jest.fn<(path: string, encoding: string) => Promise<string>>();
const close = jest.fn();
const watch = jest.fn<(path: string, listener: () => void) => { close: typeof close }>();
jest.unstable_mockModule("node:fs/promises", () => ({ ...fsPromises, readFile }));
jest.unstable_mockModule("node:fs", () => ({ ...fs, watch }));
let CredentialsWatcher: typeof Watcher;

const usernamePath = "/vault/secrets/postgresql_username";
const passwordPath = "/vault/secrets/postgresql_password";

describe("CredentialsWatcher", () => {
    let watcher: Watcher;
    let files: Record<string, string>;
    let change: () => void;
    const writeReconnect = jest.fn<(options: { user: string; password: string }) => Promise<void>>();
    const readReconnect = jest.fn<(options: { user: string; password: string }) => Promise<void>>();

    beforeAll(async () => {
        const modulePath = "./credentials-watcher";
        ({ CredentialsWatcher } = await import(modulePath));
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
        files = { [usernamePath]: " user\n", [passwordPath]: " password\n" };
        readFile.mockReset().mockImplementation((path) => Promise.resolve(files[path]));
        watch.mockReset().mockImplementation((_path, listener) => {
            change = listener;
            return { close };
        });
        writeReconnect.mockReset().mockResolvedValue(undefined);
        readReconnect.mockReset().mockResolvedValue(undefined);
        watcher = new CredentialsWatcher(
            { reconnect: writeReconnect } as unknown as MikroORM,
            { reconnect: readReconnect } as unknown as MikroORM,
        );
    });

    afterEach(() => {
        watcher.onModuleDestroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe("onModuleInit", () => {
        it("reads and trims initial credentials without reconnecting", async () => {
            await watcher.onModuleInit();
            expect(readFile.mock.calls).toEqual([
                [usernamePath, "utf8"],
                [passwordPath, "utf8"],
            ]);
            expect(watch).toHaveBeenCalledWith("/vault/secrets", expect.any(Function));
            files = { [usernamePath]: "user", [passwordPath]: "password" };
            change();
            await jest.advanceTimersByTimeAsync(2000);
            expect(writeReconnect).not.toHaveBeenCalled();
            expect(readReconnect).not.toHaveBeenCalled();
        });

        it.each([usernamePath, passwordPath])("reconnects both pools when %s changes", async (path) => {
            await watcher.onModuleInit();
            files[path] = " rotated\n";
            change();
            await jest.advanceTimersByTimeAsync(2000);
            const expected = { user: files[usernamePath].trim(), password: files[passwordPath].trim() };
            expect(writeReconnect.mock.calls).toEqual([[expected]]);
            expect(readReconnect.mock.calls).toEqual([[expected]]);
            change();
            await jest.advanceTimersByTimeAsync(2000);
            expect(writeReconnect).toHaveBeenCalledTimes(1);
        });

        it("debounces repeated notifications and uses the latest pair of credentials", async () => {
            await watcher.onModuleInit();
            files[usernamePath] = "new-user";
            change();
            await jest.advanceTimersByTimeAsync(1000);
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(1999);
            expect(writeReconnect).not.toHaveBeenCalled();
            await jest.advanceTimersByTimeAsync(1);
            expect(writeReconnect.mock.calls).toEqual([[{ user: "new-user", password: "new-password" }]]);
            expect(readReconnect.mock.calls).toEqual(writeReconnect.mock.calls);
        });

        it("waits for the write reconnect before reconnecting the read pool", async () => {
            let resolve!: () => void;
            const pending = new Promise<void>((done) => {
                resolve = done;
            });
            writeReconnect.mockReturnValue(pending);
            await watcher.onModuleInit();
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(2000);
            expect(writeReconnect).toHaveBeenCalledTimes(1);
            expect(readReconnect).not.toHaveBeenCalled();
            resolve();
            await jest.advanceTimersByTimeAsync(0);
            expect(readReconnect).toHaveBeenCalledTimes(1);
        });

        it("propagates initial read errors without installing a watcher", async () => {
            const error = new Error("secrets unavailable");
            readFile.mockRejectedValueOnce(error);
            await expect(watcher.onModuleInit()).rejects.toBe(error);
            expect(watch).not.toHaveBeenCalled();
        });

        it("logs reload errors and accepts a later notification", async () => {
            await watcher.onModuleInit();
            readFile.mockRejectedValueOnce(new Error("read failed"));
            change();
            await jest.advanceTimersByTimeAsync(2000);
            expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining("read failed"));
            expect(writeReconnect).not.toHaveBeenCalled();
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(2000);
            expect(readReconnect).toHaveBeenCalledWith({ user: "user", password: "new-password" });
        });

        it.each(["write", "read"])(
            "retries the same credentials on a later notification after %s reconnect fails",
            async (kind) => {
                await watcher.onModuleInit();
                const reconnect = kind === "write" ? writeReconnect : readReconnect;
                reconnect.mockRejectedValueOnce(new Error("reconnect failed"));
                files[passwordPath] = "new-password";
                change();
                await jest.advanceTimersByTimeAsync(2000);
                expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining("reconnect failed"));
                expect(Logger.prototype.log).not.toHaveBeenCalled();
                if (kind === "write") {
                    expect(readReconnect).not.toHaveBeenCalled();
                }
                change();
                await jest.advanceTimersByTimeAsync(2000);
                expect(reconnect).toHaveBeenCalledTimes(2);
                expect(readReconnect).toHaveBeenLastCalledWith({ user: "user", password: "new-password" });
                expect(Logger.prototype.log).toHaveBeenCalledTimes(1);
            },
        );
    });

    describe("onModuleDestroy", () => {
        it("closes the watcher and cancels a pending reload on shutdown", async () => {
            await watcher.onModuleInit();
            files[passwordPath] = "new-password";
            change();
            watcher.onModuleDestroy();
            expect(close).toHaveBeenCalledTimes(1);
            expect(jest.getTimerCount()).toBe(0);
            await jest.advanceTimersByTimeAsync(2000);
            expect(writeReconnect).not.toHaveBeenCalled();
        });

        it("allows shutdown before initialization", () => {
            expect(() => watcher.onModuleDestroy()).not.toThrow();
            expect(close).not.toHaveBeenCalled();
        });
    });
});
