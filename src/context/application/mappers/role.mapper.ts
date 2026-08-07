import { InvalidationScope } from "~context/enums";

export class RoleMapper implements Mappers.Role.Contract {
    public projectionCreatePayload(
        props: Mappers.Role.ProjectionCreatePayload.Props,
    ): Mappers.Role.ProjectionCreatePayload.Result {
        return {
            realm: props.entity.realm.id,
            parent: props.parent.id,
            role: props.entity.id,
        };
    }

    public projectionPurgePayload(
        props: Mappers.Role.ProjectionPurgePayload.Props,
    ): Mappers.Role.ProjectionPurgePayload.Result {
        return {
            realm: props.roles[0].realm.id,
            role: props.roles[0].id,
        };
    }

    public projectionSubtreePurgePayload(
        props: Mappers.Role.ProjectionSubtreePurgePayload.Props,
    ): Mappers.Role.ProjectionSubtreePurgePayload.Result {
        return {
            realm: props.root.realm.id,
            role: props.root.id,
        };
    }

    public subtreeAccessCachePayload(
        props: Mappers.Role.SubtreeAccessCachePayload.Props,
    ): Mappers.Role.SubtreeAccessCachePayload.Result {
        return {
            items: props.entities.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Mappers.Role.ProjectionUpdatePayload.Props,
    ): Mappers.Role.ProjectionUpdatePayload.Result {
        return {
            roles: props.roles.map(({ id }) => id),
            isRevoked: props.roles[0].isRevoked,
            realm: props.roles[0].realm.id,
        };
    }

    public projectionMovePayload(
        props: Mappers.Role.ProjectionMovePayload.Props,
    ): Mappers.Role.ProjectionMovePayload.Result {
        return {
            realm: props.target.realm.id,
            steps: props.steps,
        };
    }

    public moveAccessCachePayload(
        props: Mappers.Role.MoveAccessCachePayload.Props,
    ): Mappers.Role.MoveAccessCachePayload.Result {
        return {
            items: [
                {
                    scope: InvalidationScope.REALM,
                    realm: props.target.realm.id,
                },
            ],
        };
    }

    public accessCachePayload(props: Mappers.Role.AccessCachePayload.Props): Mappers.Role.AccessCachePayload.Result {
        return {
            items: props.roles.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
