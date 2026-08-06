import { JWTPayload } from "jose";

declare global {
    namespace CommonServices {
        namespace JWT {
            interface Contract extends PublicContract {}

            interface PublicContract {
                verifyAccess: VerifyAccess.Signature;
            }

            namespace VerifyAccess {
                type Props = {
                    token: string;
                };

                type Result = Promise<JWTPayload>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
