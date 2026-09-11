import type { PermissionOverrideService } from "~context/domain/services/permission-override.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace PermissionOverride {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly permissions?: Entities.Permission[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<PermissionOverrideService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
