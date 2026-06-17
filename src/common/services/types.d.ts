import { JWTPayload } from "jose";

declare global {
    namespace CommonServices {
        namespace JWT {
            interface Contract {
                verifyAccess(token: string): Promise<JWTPayload>;
            }
        }
    }
}
