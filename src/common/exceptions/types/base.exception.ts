export abstract class BaseException extends Error {
    public readonly timestamp: string;

    public constructor(
        public readonly kind: string,
        public readonly statusCode: number,
        public readonly messageKey: string,
        public readonly params?: Record<string, unknown>,
        public readonly details?: Exception.ValidationDetail[],
    ) {
        super(messageKey);
        Object.setPrototypeOf(this, new.target.prototype);
        this.timestamp = new Date().toISOString();
    }
}
