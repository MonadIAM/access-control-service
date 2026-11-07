import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const STATE_REQUIRE = 'require("context.infrastructure.scripts.shared.state")';

export async function readProjectionSource(file: string, mutation?: string, directory = __dirname): Promise<string> {
    const [content, state, materialize, template] = await Promise.all([
        readFile(file, "utf8"),
        readFile(join(directory, "shared/state.lua"), "utf8"),
        mutation ? readFile(join(directory, "shared/materialize.lua"), "utf8") : Promise.resolve(""),
        readFile(join(directory, mutation ? "mutation.lua" : "query.lua"), "utf8"),
    ]);
    const shared = state.replace(
        "-- PROJECTION_SYSTEM_REALM",
        `local projection_system_realm = ${JSON.stringify(SYSTEM_REALM_ID)}`,
    );
    const script = content.replaceAll(STATE_REQUIRE, "projection_state");
    const materializer = materialize.replaceAll(STATE_REQUIRE, "projection_state");

    return template
        .replace("-- PROJECTION_STATE", shared.replaceAll("\n", "\n    "))
        .replace("-- PROJECTION_MATERIALIZER", materializer.replaceAll("\n", "\n    "))
        .replace("-- PROJECTION_OPERATION", `local script = ${JSON.stringify(mutation ?? "")}`)
        .replace("-- PROJECTION_SCRIPT", mutation ? script.replaceAll("\n", "\n    ") : script);
}
