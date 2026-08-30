/// <reference path="../../types.d.ts" />
/// <reference path="./types.d.ts" />
/* eslint-disable no-console */
/**
 * Startup script, not a Nest module.
 * Runs before main.ts from docker/app/entrypoint.sh and does not participate in DI.
 */
import { SCHEMA_REGISTRY_ARTIFACTS } from "@monadiam/shared";
import { readFile } from "node:fs/promises";

class SchemaRegistry implements SchemaRegistry.Contract {
    private static readonly PREFIX = `[${SchemaRegistry.name}]`;

    private readonly config: SchemaRegistry.Config = {
        enabled: process.env.SCHEMA_REGISTRY_SYNC_ENABLED === "true",
        scope: process.env.SCHEMA_REGISTRY_SYNC_SCOPE,
        registryUrl: process.env.SCHEMA_REGISTRY_URL,
        mode: process.env.SCHEMA_REGISTRY_SYNC_MODE,
        serviceName: process.env.SERVICE_NAME,
    };

    public async run(): SchemaRegistry.Run.Result {
        if (this.config.enabled) {
            const artifacts = SCHEMA_REGISTRY_ARTIFACTS.filter((artifact) => {
                const produced = artifact.producers.includes(this.config.serviceName);
                const consumed = artifact.consumers.includes(this.config.serviceName);
                if (this.config.scope === "all") {
                    return [produced, consumed].includes(true);
                } else {
                    return this.config.scope === "produced" ? produced : consumed;
                }
            });

            if (artifacts.length) {
                for await (const artifact of artifacts) {
                    await this.sync({ artifact, config: this.config });
                }
            } else {
                console.warn(`${SchemaRegistry.PREFIX}: no schemas selected`);
            }
        } else {
            console.warn(`${SchemaRegistry.PREFIX}: disabled`);
        }
    }

    public async sync({ artifact, config }: SchemaRegistry.Sync.Props): SchemaRegistry.Sync.Result {
        const content = await readFile(artifact.protoPath, "utf8");
        const current = await this.load({ artifact, config });

        if (config.mode === "verify") {
            if (!current) {
                throw new Error(`${SchemaRegistry.PREFIX}: schema missing`);
            }
            if (current !== content) {
                throw new Error(`${SchemaRegistry.PREFIX}: schema differs`);
            }
            console.log(`${SchemaRegistry.PREFIX}: unchanged - ${artifact.group}/${artifact.artifact}`);
        } else if (current === content) {
            console.log(`${SchemaRegistry.PREFIX}: unchanged - ${artifact.group}/${artifact.artifact}`);
        } else {
            await this.save({ artifact, config, content, exists: current !== null });
        }
    }

    public async load({ artifact, config }: SchemaRegistry.Load.Props): SchemaRegistry.Load.Result {
        const groupUrl = `${config.registryUrl}/apis/registry/v3/groups/${encodeURIComponent(artifact.group)}/artifacts`;
        const artifactUrl = `${groupUrl}/${encodeURIComponent(artifact.artifact)}`;
        const versions = await fetch(`${artifactUrl}/versions?orderby=createdOn&order=desc&limit=1`);

        if (versions.status === 404) {
            return null;
        }

        if (!versions.ok) {
            throw new Error(`${SchemaRegistry.PREFIX}: registry unavailable`);
        }

        const body = (await versions.json()) as SchemaRegistry.Versions;
        const version = body.versions?.[0]?.version;

        if (!version) {
            return null;
        }

        const current = await fetch(`${artifactUrl}/versions/${encodeURIComponent(version)}/content`);

        if (!current.ok) {
            throw new Error(`${SchemaRegistry.PREFIX}: schema read failed`);
        }

        return current.text();
    }

    public async save({ artifact, config, content, exists }: SchemaRegistry.Save.Props): SchemaRegistry.Save.Result {
        const groupUrl = `${config.registryUrl}/apis/registry/v3/groups/${encodeURIComponent(artifact.group)}/artifacts`;
        const artifactUrl = `${groupUrl}/${encodeURIComponent(artifact.artifact)}`;
        const url = exists ? `${artifactUrl}/versions` : groupUrl;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                exists
                    ? { content: { content, contentType: "text/plain" } }
                    : {
                          artifact: artifact.artifact,
                          artifactType: artifact.artifactType,
                          firstVersion: { content: { content, contentType: "text/plain" } },
                      },
            ),
        });

        if (!response.ok) {
            throw new Error(`${SchemaRegistry.PREFIX}: schema publish failed (${response.status})`);
        }

        console.log(`${SchemaRegistry.PREFIX}: ${exists ? "updated" : "created"} - ${artifact.group}/${artifact.artifact}`);
    }
}

new SchemaRegistry().run().catch((error) => {
    console.error(error);
    process.exit(1);
});
