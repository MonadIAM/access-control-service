import type { ReauthenticationMethod } from "~context/enums";

declare global {
    namespace Reauthentication {
        type Options = {
            methods?: ReauthenticationMethod[];
            sameFactor?: boolean;
        };
    }

    namespace Extract {
        type Meta = {
            userAgent: string;
            ip: string;
        };

        namespace Session {
            type Public = {
                realms?: string[];
                account?: string;
                session?: string;
                client?: string;
                scope?: string;
            };

            type Auth = {
                realms: string[];
                account: string;
                session: string;
                client: string;
                scope: string;
            };
        }
    }
}
