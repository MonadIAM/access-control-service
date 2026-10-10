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

describe("[Utility] - CredentialsWatcher", () => {
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

    describe("[Method] - onModuleInit", () => {
        it("[case] - reads and trims initial credentials without reconnecting", async () => {
            // Arrange

            // Act
            await watcher.onModuleInit();

            const initialReads = readFile.mock.calls.slice();
            files = { [usernamePath]: "user", [passwordPath]: "password" };
            change();
            await jest.advanceTimersByTimeAsync(2000);

            // Assert
            expect(initialReads).toEqual([
                [usernamePath, "utf8"],
                [passwordPath, "utf8"],
            ]);
            expect(watch).toHaveBeenCalledWith("/vault/secrets", expect.any(Function));
            expect(writeReconnect).not.toHaveBeenCalled();
            expect(readReconnect).not.toHaveBeenCalled();
        });

        it.each([usernamePath, passwordPath])("[case] - reconnects both pools when %s changes", async (path) => {
            // Arrange

            // Act
            await watcher.onModuleInit();
            files[path] = " rotated\n";
            change();
            await jest.advanceTimersByTimeAsync(2000);
            const expected = { user: files[usernamePath].trim(), password: files[passwordPath].trim() };

            const firstWriteReconnects = writeReconnect.mock.calls.slice();
            const firstReadReconnects = readReconnect.mock.calls.slice();
            change();
            await jest.advanceTimersByTimeAsync(2000);

            // Assert
            expect(firstWriteReconnects).toEqual([[expected]]);
            expect(firstReadReconnects).toEqual([[expected]]);
            expect(writeReconnect).toHaveBeenCalledTimes(1);
        });

        it("[case] - debounces repeated notifications and uses the latest pair of credentials", async () => {
            // Arrange

            // Act
            await watcher.onModuleInit();
            files[usernamePath] = "new-user";
            change();
            await jest.advanceTimersByTimeAsync(1000);
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(1999);

            const reconnectsBeforeDeadline = writeReconnect.mock.calls.length;
            await jest.advanceTimersByTimeAsync(1);

            // Assert
            expect(reconnectsBeforeDeadline).toBe(0);
            expect(writeReconnect.mock.calls).toEqual([[{ user: "new-user", password: "new-password" }]]);
            expect(readReconnect.mock.calls).toEqual(writeReconnect.mock.calls);
        });

        it("[case] - waits for the write reconnect before reconnecting the read pool", async () => {
            // Arrange
            let resolve!: () => void;
            const pending = new Promise<void>((done) => {
                resolve = done;
            });
            writeReconnect.mockReturnValue(pending);

            // Act
            await watcher.onModuleInit();
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(2000);

            const writeCallsBeforeCompletion = writeReconnect.mock.calls.length;
            const readCallsBeforeCompletion = readReconnect.mock.calls.length;
            resolve();
            await jest.advanceTimersByTimeAsync(0);

            // Assert
            expect(writeCallsBeforeCompletion).toBe(1);
            expect(readCallsBeforeCompletion).toBe(0);
            expect(readReconnect).toHaveBeenCalledTimes(1);
        });

        it("[case] - propagates initial read errors without installing a watcher", async () => {
            // Arrange
            const error = new Error("secrets unavailable");
            readFile.mockRejectedValueOnce(error);

            // Act
            const result = watcher.onModuleInit();

            // Assert
            await expect(result).rejects.toBe(error);
            expect(watch).not.toHaveBeenCalled();
        });

        it("[case] - logs reload errors and accepts a later notification", async () => {
            // Arrange

            // Act
            await watcher.onModuleInit();
            readFile.mockRejectedValueOnce(new Error("read failed"));
            change();

            await jest.advanceTimersByTimeAsync(2000);
            const reconnectsAfterFailure = writeReconnect.mock.calls.length;
            files[passwordPath] = "new-password";
            change();
            await jest.advanceTimersByTimeAsync(2000);

            // Assert
            expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining("read failed"));
            expect(reconnectsAfterFailure).toBe(0);
            expect(readReconnect).toHaveBeenCalledWith({ user: "user", password: "new-password" });
        });

        it.each(["write", "read"])(
            "[case] - retries the same credentials on a later notification after %s reconnect fails",
            async (kind) => {
                // Arrange

                // Act
                await watcher.onModuleInit();
                const reconnect = kind === "write" ? writeReconnect : readReconnect;
                reconnect.mockRejectedValueOnce(new Error("reconnect failed"));
                files[passwordPath] = "new-password";
                change();

                await jest.advanceTimersByTimeAsync(2000);
                const loggedBeforeRetry = jest.mocked(Logger.prototype.log).mock.calls.length;
                const readCallsBeforeRetry = readReconnect.mock.calls.length;
                change();
                await jest.advanceTimersByTimeAsync(2000);

                // Assert
                expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining("reconnect failed"));
                expect(loggedBeforeRetry).toBe(0);
                if (kind === "write") {
                    expect(readCallsBeforeRetry).toBe(0);
                }
                expect(reconnect).toHaveBeenCalledTimes(2);
                expect(readReconnect).toHaveBeenLastCalledWith({ user: "user", password: "new-password" });
                expect(Logger.prototype.log).toHaveBeenCalledTimes(1);
            },
        );
    });

    describe("[Method] - onModuleDestroy", () => {
        it("[case] - closes the watcher and cancels a pending reload on shutdown", async () => {
            // Arrange
            await watcher.onModuleInit();
            files[passwordPath] = "new-password";
            change();

            // Act
            watcher.onModuleDestroy();
            const result = jest.getTimerCount();
            await jest.advanceTimersByTimeAsync(2000);

            // Assert
            expect(close).toHaveBeenCalledTimes(1);
            expect(result).toBe(0);
            expect(writeReconnect).not.toHaveBeenCalled();
        });

        it("[case] - allows shutdown before initialization", () => {
            // Arrange

            // Act
            const act = (): unknown => watcher.onModuleDestroy();

            // Assert
            expect(act).not.toThrow();
            expect(close).not.toHaveBeenCalled();
        });
    });
});
