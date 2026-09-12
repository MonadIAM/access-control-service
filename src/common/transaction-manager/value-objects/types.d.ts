import { DeltaChanges as DeltaChangesVO } from "./delta-changes";
import { MaskedValue as MaskedValueVO } from "./masked-value";

declare global {
    namespace ValueObjects {
        namespace DeltaChanges {
            interface Contract {
                readonly [field: string]: {
                    readonly old: unknown;
                    readonly new: unknown;
                };
            }

            type ConstructorProps = Record<
                string,
                {
                    old: unknown;
                    new: unknown;
                }
            >;
        }

        type DeltaChanges = DeltaChangesVO;

        namespace MaskedValue {
            interface Contract {
                readonly value: string;
                readonly hash: string;
            }

            type ConstructorProps = {
                value: string;
                hash: string;
            };
        }

        type MaskedValue = MaskedValueVO;
    }
}
