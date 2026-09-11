import type { RoleConflictMemberService } from "~context/domain/services/role-conflict-member.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace RoleConflictMember {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<RoleConflictMemberService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
