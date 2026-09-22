declare namespace Unit.Domain.Realm {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            permissions?: Entities.Permission[];
            roles?: Entities.Role[];
            realm?: Entities.Realm;
        };

        type Result = Core.Service.Context<Services.Realm.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
