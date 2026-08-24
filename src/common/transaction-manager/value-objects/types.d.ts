import { DeltaChanges as DeltaChangesVO } from "./delta-changes";
import { MaskedValue as MaskedValueVO } from "./masked-value";

declare global {
    namespace ValueObjects {
        namespace DeltaChanges {
            interface Contract {
                [field: string]: {
                    old: unknown;
                    new: unknown;
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
                value: string;
                hash: string;
            }

            type ConstructorProps = {
                value: string;
                hash: string;
            };
        }

        type MaskedValue = MaskedValueVO;
    }
}
