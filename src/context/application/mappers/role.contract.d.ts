declare namespace Commands.Mappers.Role {
    interface Contract extends PublicContract {}

    interface PublicContract {
        projectionSubtreePurgePayload: ProjectionSubtreePurgePayload.Signature;
        subtreeAccessCachePayload: SubtreeAccessCachePayload.Signature;
        projectionCreatePayload: ProjectionCreatePayload.Signature;
        projectionUpdatePayload: ProjectionUpdatePayload.Signature;
        projectionPurgePayload: ProjectionPurgePayload.Signature;
        moveAccessCachePayload: MoveAccessCachePayload.Signature;
        projectionMovePayload: ProjectionMovePayload.Signature;
        accessCachePayload: AccessCachePayload.Signature;
    }

    namespace ProjectionSubtreePurgePayload {
        type Props = {
            entities: Entities.Role[];
            root: Entities.Role;
        };

        type Result = Scripts.Role.Purge.Props;

        type Signature = (props: Props) => Result;
    }

    namespace SubtreeAccessCachePayload {
        type Props = {
            entities: Entities.Role[];
            root: Entities.Role;
        };

        type Result = Topics.AccessCache.Message["payload"];

        type Signature = (props: Props) => Result;
    }

    namespace ProjectionCreatePayload {
        type Props = {
            entity: Entities.Role;
            parent: Entities.Role;
        };

        type Result = Scripts.Role.Create.Props;

        type Signature = (props: Props) => Result;
    }

    namespace ProjectionUpdatePayload {
        type Props = {
            roles: Entities.Role[];
        };

        type Result = Scripts.Role.Update.Props;

        type Signature = (props: Props) => Result;
    }

    namespace ProjectionPurgePayload {
        type Props = {
            roles: Entities.Role[];
        };

        type Result = Scripts.Role.Purge.Props;

        type Signature = (props: Props) => Result;
    }

    namespace MoveAccessCachePayload {
        type Props = {
            steps: Services.Role.Move.Steps;
            target: Entities.Role;
        };

        type Result = Topics.AccessCache.Message["payload"];

        type Signature = (props: Props) => Result;
    }

    namespace ProjectionMovePayload {
        type Props = {
            steps: Services.Role.Move.Steps;
            target: Entities.Role;
        };

        type Result = Scripts.RoleClosure.Update.Props;

        type Signature = (props: Props) => Result;
    }

    namespace AccessCachePayload {
        type Props = {
            roles: Entities.Role[];
        };

        type Result = Topics.AccessCache.Message["payload"];

        type Signature = (props: Props) => Result;
    }
}
