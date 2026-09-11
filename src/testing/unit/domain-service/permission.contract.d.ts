import type { PermissionService } from "~context/domain/services/permission.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Permission {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly permissions?: Entities.Permission[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<PermissionService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
