import type { RolePermissionAssignmentService } from "~context/domain/services/role-permission-assignment.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace RolePermissionAssignment {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly permissions?: Entities.Permission[];
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<RolePermissionAssignmentService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
