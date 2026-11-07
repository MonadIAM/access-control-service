import { InvalidationScope } from "~context/enums";

export class RoleMapper implements Commands.Mappers.Role.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.Role.ProjectionCreatePayload.Props,
    ): Commands.Mappers.Role.ProjectionCreatePayload.Result {
        return {
            realm: props.entity.realm.id,
            steps: props.steps.map(({ removedPaths, upsertedPaths }) => ({
                removedPaths: removedPaths.map(({ ancestor, descendant }) => ({
                    descendant: { id: descendant.id },
                    ancestor: { id: ancestor.id },
                })),
                upsertedPaths: upsertedPaths.map(({ ancestor, descendant, depth }) => ({
                    descendant: { id: descendant.id },
                    ancestor: { id: ancestor.id },
                    depth,
                })),
            })),
            role: props.entity.id,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.Role.ProjectionPurgePayload.Props,
    ): Commands.Mappers.Role.ProjectionPurgePayload.Result {
        return {
            realm: props.roles[0].realm.id,
            roles: props.roles.map(({ id }) => id),
            paths: props.paths.map(({ ancestor, descendant, depth }) => ({
                descendant: { id: descendant.id },
                ancestor: { id: ancestor.id },
                depth,
            })),
        };
    }

    public projectionSubtreePurgePayload(
        props: Commands.Mappers.Role.ProjectionSubtreePurgePayload.Props,
    ): Commands.Mappers.Role.ProjectionSubtreePurgePayload.Result {
        return {
            realm: props.root.realm.id,
            roles: props.entities.map(({ id }) => id),
            paths: [],
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
            steps: props.steps.map(({ removedPaths, upsertedPaths }) => ({
                removedPaths: removedPaths.map(({ ancestor, descendant }) => ({
                    descendant: { id: descendant.id },
                    ancestor: { id: ancestor.id },
                })),
                upsertedPaths: upsertedPaths.map(({ ancestor, descendant, depth }) => ({
                    descendant: { id: descendant.id },
                    ancestor: { id: ancestor.id },
                    depth,
                })),
            })),
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
