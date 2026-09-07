import type RedisClient from "ioredis";
import type { RedisStatus } from "ioredis";

declare global {
    namespace RedisConnection {
        type Kind = "cache" | "limiter" | "queue";

        type Status = RedisStatus;

        type Snapshot = {
            connected: boolean;
            status: Status;
            kind: Kind;
            ready: boolean;
        };

        type StatusValue = {
            status: Status;
            kind: Kind;
            value: 0 | 1;
        };

        namespace Registry {
            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                register: Register.Signature;
            }

            namespace Register {
                type Props = {
                    client: RedisClient;
                    kind: Kind;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                statusValues: StatusValues.Signature;
                snapshots: Snapshots.Signature;
            }

            namespace StatusValues {
                type Result = StatusValue[];

                type Signature = () => Result;
            }

            namespace Snapshots {
                type Result = Snapshot[];

                type Signature = () => Result;
            }
        }
    }
}
