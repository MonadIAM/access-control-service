declare namespace CLI {
    namespace Postman {
        namespace Patcher {
            interface PrivateContract {
                upsertEvent(collection: Postman.Collection, event: Postman.Event): void;
                ensureVariable(collection: Postman.Collection, key: string): void;
                createScript(path: string): Postman.Script;
            }

            interface Contract extends PrivateContract {
                patch(): void;
            }
        }

        type Script = {
            type: "text/javascript";
            exec: string[];
        };

        type Event = {
            listen: "prerequest" | "test";
            script: Script;
        };

        type Variable = {
            type?: "string";
            value: string;
            key: string;
        };

        type Collection = {
            [key: string]: unknown;
            variable?: Variable[];
            event?: Event[];
        };

        type PatchOptions = {
            postResponse: string;
            preRequest: string;
            output: string;
            input: string;
        };
    }
}
