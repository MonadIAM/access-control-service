export function requiredEnvironment(name: string): string {
    const value = process.env[name];
    if (value) {
        return value;
    } else {
        throw new Error(`${name} is not configured; run the integration Jest setup first`);
    }
}
