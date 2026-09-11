import type { RealmService } from "~context/domain/services/realm.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Realm {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly permissions?: Entities.Permission[];
                        readonly roles?: Entities.Role[];
                        readonly realm?: Entities.Realm;
                    };

                    type Result = Core.Service.Context<RealmService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
