import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export class PostmanPatcher implements CLI.Postman.Patcher.Contract {
    private static readonly VARIABLES: string[] = ["access_token", "refresh_token", "pending_token"];
    private static readonly DEFAULT_OPTIONS: CLI.Postman.PatchOptions = {
        postResponse: "cli/postman/scripts/post-response.mjs",
        preRequest: "cli/postman/scripts/pre-request.mjs",
        output: "access-control.postman.json",
        input: "access-control.postman.json",
    };

    public constructor(private readonly options: CLI.Postman.PatchOptions) {}

    public static fromCliArgs(args: string[]): PostmanPatcher {
        const options: CLI.Postman.PatchOptions = { ...PostmanPatcher.DEFAULT_OPTIONS };
        for (let index = 0; index < args.length; ++index) {
            const next = args[index + 1];
            if (next) {
                switch (args[index]) {
                    case "--input":
                        options.input = next;
                        ++index;
                        break;
                    case "--output":
                        options.output = next;
                        ++index;
                        break;
                    case "--pre-request":
                        options.preRequest = next;
                        ++index;
                        break;
                    case "--post-response":
                        options.postResponse = next;
                        ++index;
                        break;
                }
            }
        }
        return new PostmanPatcher(options);
    }

    public patch(): void {
        const collection = JSON.parse(readFileSync(resolve(this.options.input), "utf8"));

        this.upsertEvent(collection, {
            listen: "prerequest",
            script: this.createScript(this.options.preRequest),
        });

        this.upsertEvent(collection, {
            listen: "test",
            script: this.createScript(this.options.postResponse),
        });

        for (const variable of PostmanPatcher.VARIABLES) {
            this.ensureVariable(collection, variable);
        }

        writeFileSync(resolve(this.options.output), `${JSON.stringify(collection, null, 2)}\n`);
    }

    public createScript(path: string): CLI.Postman.Script {
        return {
            exec: readFileSync(resolve(path), "utf8").replace(/\r\n/g, "\n").trimEnd().split("\n"),
            type: "text/javascript",
        };
    }

    public upsertEvent(collection: CLI.Postman.Collection, event: CLI.Postman.Event): void {
        const events = collection.event ?? [];
        const nextEvents = events.filter((item) => item.listen !== event.listen);
        nextEvents.push(event);
        collection.event = nextEvents;
    }

    public ensureVariable(collection: CLI.Postman.Collection, key: string): void {
        const variables = collection.variable ?? [];
        if (!variables.some((variable) => variable.key === key)) {
            variables.push({ key, value: "", type: "string" });
        }
        collection.variable = variables;
    }
}
