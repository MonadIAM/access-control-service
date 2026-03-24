import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { EnvironmentVariablesDTO } from "~common/dto";

export function validateEnv(config: UnknownObject): EnvironmentVariablesDTO {
    const validatedConfig = plainToInstance(EnvironmentVariablesDTO, config, {
        enableImplicitConversion: false,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length) {
        const messages = errors.map((error) => error.toString()).join("\n");
        throw new Error(`\n${messages}`);
    } else {
        return validatedConfig;
    }
}
