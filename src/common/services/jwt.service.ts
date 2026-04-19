import { jwtVerify, createRemoteJWKSet, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { Injectable, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract, OnModuleInit {
    private readonly issuer: string;
    private readonly jwksUrl: URL;

    private jwks!: JWTVerifyGetKey;

    public constructor(private readonly config: ConfigService) {
        this.jwksUrl = new URL(this.config.getOrThrow<string>("JWT_JWKS_URL"));
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
    }

    public onModuleInit(): void {
        this.jwks = createRemoteJWKSet(this.jwksUrl, {
            cacheMaxAge: 10 * 60 * 1000,
            cooldownDuration: 30 * 1000,
            timeoutDuration: 5 * 1000,
        });
    }

    public async verify(token: string): Promise<JWTPayload> {
        const { payload } = await jwtVerify(token, this.jwks, {
            issuer: this.issuer,
        });
        return payload;
    }
}
