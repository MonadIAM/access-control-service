import type { AccountRoleAssignmentService } from "~context/domain/services/account-role-assignment.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace AccountRoleAssignment {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<AccountRoleAssignmentService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
