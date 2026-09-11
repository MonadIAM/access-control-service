import type { RoleService } from "~context/domain/services/role.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Role {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                        readonly subtreeLimit?: number;
                    };

                    type Result = Core.Service.Context<RoleService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
