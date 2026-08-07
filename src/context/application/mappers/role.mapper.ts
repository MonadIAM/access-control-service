import { InvalidationScope } from "~context/enums";

export class RoleMapper implements Commands.Mappers.Role.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.Role.ProjectionCreatePayload.Props,
    ): Commands.Mappers.Role.ProjectionCreatePayload.Result {
        return {
            realm: props.entity.realm.id,
            parent: props.parent.id,
            role: props.entity.id,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.Role.ProjectionPurgePayload.Props,
    ): Commands.Mappers.Role.ProjectionPurgePayload.Result {
        return {
            realm: props.roles[0].realm.id,
            role: props.roles[0].id,
        };
    }

    public projectionSubtreePurgePayload(
        props: Commands.Mappers.Role.ProjectionSubtreePurgePayload.Props,
    ): Commands.Mappers.Role.ProjectionSubtreePurgePayload.Result {
        return {
            realm: props.root.realm.id,
            role: props.root.id,
        };
    }

    public subtreeAccessCachePayload(
        props: Commands.Mappers.Role.SubtreeAccessCachePayload.Props,
    ): Commands.Mappers.Role.SubtreeAccessCachePayload.Result {
        return {
            items: props.entities.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.Role.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.Role.ProjectionUpdatePayload.Result {
        return {
            roles: props.roles.map(({ id }) => id),
            isRevoked: props.roles[0].isRevoked,
            realm: props.roles[0].realm.id,
        };
    }

    public projectionMovePayload(
        props: Commands.Mappers.Role.ProjectionMovePayload.Props,
    ): Commands.Mappers.Role.ProjectionMovePayload.Result {
        return {
            realm: props.target.realm.id,
            steps: props.steps,
        };
    }

    public moveAccessCachePayload(
        props: Commands.Mappers.Role.MoveAccessCachePayload.Props,
    ): Commands.Mappers.Role.MoveAccessCachePayload.Result {
        return {
            items: [
                {
                    scope: InvalidationScope.REALM,
                    realm: props.target.realm.id,
                },
            ],
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.Role.AccessCachePayload.Props,
    ): Commands.Mappers.Role.AccessCachePayload.Result {
        return {
            items: props.roles.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
