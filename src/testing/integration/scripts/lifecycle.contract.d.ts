import Redis from "ioredis";

import { ProjectionScript } from "~context/infrastructure/scripts";

declare global {
    namespace Fixtures.Projection.Lifecycle {
        interface Contract {
            overridePermission: OverridePermission.Signature;
            grantPermission: GrantPermission.Signature;
            createScenario: CreateScenario.Signature;
            seedScenario: SeedScenario.Signature;
            assignRole: AssignRole.Signature;
            execute: Execute.Signature;
        }

        type Scenario = {
            permissionRealm: string;
            permission: string;
            assignment: string;
            override: string;
            account: string;
            grant: string;
            realm: string;
            role: string;
            code: string;
        };

        namespace CreateScenario {
            type Props = {
                permission?: boolean;
            };

            type Result = Promise<Scenario>;

            type Signature = (props?: Props) => Result;
        }

        namespace SeedScenario {
            type Props = {
                isRevoked: boolean;
                effect: string;
                redis: Redis;
            };

            type Result = Promise<Scenario>;

            type Signature = (props: Props) => Result;
        }

        namespace AssignRole {
            type Result = Promise<void>;

            type Signature = (scenario: Scenario) => Result;
        }

        namespace GrantPermission {
            type Result = Promise<void>;

            type Signature = (scenario: Scenario, scope?: string) => Result;
        }

        namespace OverridePermission {
            type Result = Promise<void>;

            type Signature = (scenario: Scenario, effect?: string) => Result;
        }

        namespace Execute {
            type Result = Promise<unknown>;

            type Signature = (script: ProjectionScript, payload: object) => Result;
        }
    }

    namespace Integration.Projection.Lifecycle {
        interface Contract {
            expectMembership: ExpectMembership.Signature;
            members: Members.Signature;
        }

        namespace Members {
            type Result = Promise<string[]>;

            type Signature = (...parts: string[]) => Result;
        }

        namespace ExpectMembership {
            type Result = Promise<void>;

            type Signature = (scenario: Fixtures.Projection.Lifecycle.Scenario, active: boolean) => Result;
        }
    }
}
