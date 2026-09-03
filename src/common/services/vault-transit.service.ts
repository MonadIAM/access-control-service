import { Agent, fetch, type RequestInit } from "undici";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class VaultTransitService implements CommonServices.VaultTransit.Contract {
    private readonly dictionaryPath = "services.vault";
    private readonly cacheTTL = 6e4;

    private readonly keyCache = new Map<string, Vault.KeyCache>();
    private readonly transitMount: string;
    private readonly dispatcher: Agent;

    public constructor(private readonly configService: ConfigService) {
        this.transitMount = this.configService.getOrThrow<string>("VAULT_TRANSIT_MOUNT");
        this.dispatcher = new Agent({
            connect: { socketPath: this.configService.getOrThrow<string>("VAULT_AGENT_SOCKET_PATH") },
        });
    }

    public async getKey(props: CommonServices.VaultTransit.GetKey.Props): CommonServices.VaultTransit.GetKey.Result {
        const cached = this.keyCache.get(props.name);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        const data = await this.request<Vault.GetKey>(`keys/${encodeURIComponent(props.name)}`);
        const result = {
            latestVersion: data.latest_version,
            name: props.name,
            type: data.type,
            versions: Object.entries(data.keys).map(([version, key]) => ({
                createdAt: key.creation_time,
                publicKey: key.public_key,
                version: Number(version),
            })),
        };

        this.keyCache.set(props.name, { data: result, expiresAt: Date.now() + this.cacheTTL });
        return result;
    }

    public async getLatestVersion(
        props: CommonServices.VaultTransit.GetLatestVersion.Props,
    ): CommonServices.VaultTransit.GetLatestVersion.Result {
        const key = await this.getKey({ name: props.name });
        return key.latestVersion;
    }

    public async encrypt(props: CommonServices.VaultTransit.Encrypt.Props): CommonServices.VaultTransit.Encrypt.Result {
        const data = await this.request<Vault.Encrypt>(`encrypt/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({ plaintext: Buffer.from(props.plaintext).toString("base64") }),
        });

        return {
            ciphertext: data.ciphertext,
            version: data.key_version,
        };
    }

    public async decrypt(props: CommonServices.VaultTransit.Decrypt.Props): CommonServices.VaultTransit.Decrypt.Result {
        const data = await this.request<Vault.Decrypt>(`decrypt/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({ ciphertext: props.ciphertext }),
        });

        return Buffer.from(data.plaintext, "base64").toString();
    }

    public async rewrap(props: CommonServices.VaultTransit.Rewrap.Props): CommonServices.VaultTransit.Rewrap.Result {
        const data = await this.request<Vault.Rewrap>(`rewrap/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({ ciphertext: props.ciphertext }),
        });

        return {
            ciphertext: data.ciphertext,
            version: data.key_version,
        };
    }

    public async sign(props: CommonServices.VaultTransit.Sign.Props): CommonServices.VaultTransit.Sign.Result {
        const { version, input, name } = props;
        const data = await this.request<Vault.Sign>(`sign/${encodeURIComponent(name)}`, {
            method: "POST",
            body: JSON.stringify({
                ...(version ? { key_version: version } : {}),
                input: Buffer.from(input).toString("base64"),
                marshaling_algorithm: "jws",
            }),
        });

        const match = /^vault:v(\d+):(.+)$/.exec(data.signature);

        if (!match || Number(match[1]) !== data.key_version || (!!version && data.key_version !== version)) {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.INVALID_SIGNATURE` });
        } else {
            return {
                version: data.key_version,
                signature: match[2],
            };
        }
    }

    public async hmac(props: CommonServices.VaultTransit.Hmac.Props): CommonServices.VaultTransit.Hmac.Result {
        const data = await this.request<Vault.Hmac>(`hmac/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({
                input: Buffer.from(props.input).toString("base64"),
                algorithm: "sha2-256",
            }),
        });

        const match = /^vault:v(\d+):(.+)$/.exec(data.hmac);
        if (match) {
            return match[2];
        } else {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.INVALID_SIGNATURE` });
        }
    }

    public async signBatch(
        props: CommonServices.VaultTransit.SignBatch.Props,
    ): CommonServices.VaultTransit.SignBatch.Result {
        const data = await this.request<Vault.SignBatch>(`sign/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({
                batch_input: props.inputs.map((input) => ({
                    input: Buffer.from(input).toString("base64"),
                })),
                marshaling_algorithm: "jws",
                key_version: props.version,
            }),
        });

        return data.batch_results.map((result) => {
            const match = /^vault:v(\d+):(.+)$/.exec(result.signature);
            if (!match || Number(match[1]) !== result.key_version || result.key_version !== props.version) {
                throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.INVALID_SIGNATURE` });
            } else {
                return { version: result.key_version, signature: match[2] };
            }
        });
    }

    public async hmacBatch(
        props: CommonServices.VaultTransit.HmacBatch.Props,
    ): CommonServices.VaultTransit.HmacBatch.Result {
        const data = await this.request<Vault.HmacBatch>(`hmac/${encodeURIComponent(props.name)}`, {
            method: "POST",
            body: JSON.stringify({
                batch_input: props.inputs.map((input) => ({
                    input: Buffer.from(input).toString("base64"),
                })),
                algorithm: "sha2-256",
            }),
        });

        return data.batch_results.map((result) => {
            const match = /^vault:v(\d+):(.+)$/.exec(result.hmac);
            if (match) {
                return match[2];
            } else {
                throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.INVALID_SIGNATURE` });
            }
        });
    }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        try {
            const response = await fetch(`http://vault-agent/v1/${this.transitMount}/${path}`, {
                ...init,
                dispatcher: this.dispatcher,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                return ((await response.json()) as Vault.Response<T>).data;
            } else {
                throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.REQUEST_FAILED` });
            }
        } catch (error) {
            if (error instanceof Exception) {
                throw error;
            } else {
                throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.REQUEST_FAILED` });
            }
        }
    }
}
