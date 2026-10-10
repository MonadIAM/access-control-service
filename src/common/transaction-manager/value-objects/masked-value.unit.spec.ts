import { describe, expect, it } from "@jest/globals";

import { MaskedValue } from "./masked-value";

describe("[ValueObject] - MaskedValue", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns value and hash", () => {
            // Arrange

            // Act
            const value = new MaskedValue({ value: "****************", hash: "hmac:value" });

            // Assert
            expect(value.value).toBe("****************");
            expect(value.hash).toBe("hmac:value");
        });

        it("[case] - freezes stored data", () => {
            // Arrange

            // Act
            const value = new MaskedValue({ value: "****************", hash: "hmac:value" });

            const result = Object.isFrozen(value);
            const result2 = Reflect.set(value, "value", "plain-secret");
            const result3 = Reflect.set(value, "hash", "tampered");

            // Assert
            expect(result).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(value).toEqual({
                value: "****************",
                hash: "hmac:value",
            });
        });
    });
});
