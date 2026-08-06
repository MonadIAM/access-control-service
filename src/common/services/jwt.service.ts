import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from "jose";
import { Injectable, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract, OnModuleInit {
    private readonly dictionaryPath = "services.jwt";

    private readonly audience: string;
    private readonly issuer: string;
    private readonly jwksUrl: URL;

    private readonly algorithm = "ES256";

    private jwks!: JWTVerifyGetKey;

    public constructor(private readonly config: ConfigService) {
        this.jwksUrl = new URL(this.config.getOrThrow<string>("JWT_JWKS_URL"));
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
        this.audience = `${this.issuer}:api`;
    }

    public onModuleInit(): void {
        this.jwks = createRemoteJWKSet(this.jwksUrl, {
            cooldownDuration: ms(this.config.getOrThrow<StringValue>("JWT_JWKS_COOLDOWN_DURATION")),
            timeoutDuration: ms(this.config.getOrThrow<StringValue>("JWT_JWKS_TIMEOUT_DURATION")),
            cacheMaxAge: ms(this.config.getOrThrow<StringValue>("JWT_JWKS_CACHE_MAX_AGE")),
        });
    }

    public async verifyAccess(props: CommonServices.JWT.VerifyAccess.Props): CommonServices.JWT.VerifyAccess.Result {
        try {
            const { payload } = await jwtVerify(props.token, this.jwks, {
                requiredClaims: ["client_id", "sub", "sid", "exp", "iat", "jti"],
                audience: this.audience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "at+jwt",
            });

            return payload;
        } catch {
            throw Exception.unauthorized({
                messageKey: `${this.dictionaryPath}.INVALID_ACCESS_TOKEN`,
                headers: {
                    "WWW-Authenticate": 'Bearer error="invalid_token"',
                },
            });
        }
    }
}
