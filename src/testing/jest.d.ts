import { jest } from "@jest/globals";

declare global {
    namespace Jest {
        type Mock<T extends (...args: AnyArray) => unknown = (...args: unknown[]) => unknown> = jest.Mock<T>;

        type MockedFunction<T extends (...args: AnyArray) => unknown> = jest.MockedFunction<T>;

        type Mocked<T extends object> = jest.Mocked<T>;
    }
}
