import type { EnvironmentVariablesDTO as Environment } from "./src/common/dto/env.dto";

type EnvValue<Type> = [Type] extends [boolean]
    ? "true" | "false"
    : [Type] extends [number]
      ? `${number}`
      : [Type] extends [string]
        ? `${Type}`
        : string;

type EnvironmentVariables = {
    [Key in keyof Environment]: EnvValue<NonNullable<Environment[Key]>>;
};

declare global {
    namespace NodeJS {
        interface ProcessEnv extends EnvironmentVariables {}
    }
}
