declare namespace Unit.Domain.PermissionOverride {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            permissions?: Entities.Permission[];
            realm?: Entities.Realm;
        };

        type Result = Core.Service.Context<Services.PermissionOverride.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
