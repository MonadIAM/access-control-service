import { describe, expect, it } from "@jest/globals";

import { MaskedValue } from "./masked-value";

describe("MaskedValue Value Object", () => {
    describe("constructor", () => {
        it("should assign value and hash", () => {
            const value = new MaskedValue({ value: "****************", hash: "hmac:value" });

            expect(value.value).toBe("****************");
            expect(value.hash).toBe("hmac:value");
        });

        it("should freeze stored data", () => {
            const value = new MaskedValue({ value: "****************", hash: "hmac:value" });

            expect(Object.isFrozen(value)).toBe(true);
            expect(Reflect.set(value, "value", "plain-secret")).toBe(false);
            expect(Reflect.set(value, "hash", "tampered")).toBe(false);
            expect(value).toEqual({
                value: "****************",
                hash: "hmac:value",
            });
        });
    });
});
