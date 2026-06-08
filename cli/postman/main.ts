import { convertV2, type CollectionResult } from "openapi-to-postmanv2";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PostmanPatcher } from "./patch";

const OUTPUT = resolve("access-control.postman.json");
const INPUT = resolve("access-control.swagger.json");

function convert(): Promise<CollectionResult> {
    return new Promise((resolve, reject) => {
        convertV2({ type: "file", data: INPUT }, { folderStrategy: "Tags" }, (error, result) => {
            if (error?.message) {
                reject(new Error(error.message));
            } else if (result) {
                resolve(result);
            } else {
                reject(new Error("Postman collection conversion failed"));
            }
        });
    });
}

void (async function (): Promise<void> {
    const result = await convert();
    const collection = result.output?.find(({ type }) => type === "collection")?.data;

    if (collection) {
        writeFileSync(OUTPUT, `${JSON.stringify(collection, null, 2)}\n`);
        PostmanPatcher.fromCliArgs(process.argv.slice(2)).patch();
    } else {
        throw new Error("Postman collection conversion returned no collection");
    }
})();
