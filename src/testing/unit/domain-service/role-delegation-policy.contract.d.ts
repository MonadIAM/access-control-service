import type { RoleDelegationPolicyService } from "~context/domain/services/role-delegation-policy.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace RoleDelegationPolicy {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<RoleDelegationPolicyService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
