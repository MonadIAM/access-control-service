import { JWTPayload } from "jose";

declare global {
    namespace CommonServices {
        namespace JWT {
            interface Contract {
                verify: (token: string) => Promise<JWTPayload>;
            }
        }
    }
}
