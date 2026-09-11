import type { RoleConflictGroupService } from "~context/domain/services/role-conflict-group.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace RoleConflictGroup {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                        readonly membersLimit?: number;
                    };

                    type Result = Core.Service.Context<RoleConflictGroupService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
