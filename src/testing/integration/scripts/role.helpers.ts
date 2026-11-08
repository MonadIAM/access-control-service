import { expect } from "@jest/globals";

import { RoleIntegrationHelpers } from "~testing/integration/domain-service/role.helpers";
import { PostgresHelpers } from "~testing/integration/containers/postgres.helpers";
import { RoleCommands } from "~context/application/commands/role.commands";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Outbox } from "~common/transaction-manager/entities";
import { KafkaTopic } from "~context/enums";

export class RoleProjectionHelpers implements Integration.Projection.Role.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Projection.Role.Service.Context {
        const { transactional, roleService } = new RoleIntegrationHelpers().service(context);
        return {
            commands: new RoleCommands(transactional.service, roleService),
            consumed: new Set(),
            transactional,
        };
    }

    public async consumeProjection(
        props: Integration.Projection.Role.ConsumeProjection.Props,
    ): Integration.Projection.Role.ConsumeProjection.Result {
        const manager = props.context.transactional.readManager;
        manager.clear();
        const events = await manager.find(
            Outbox,
            { destinationTopic: KafkaTopic.PROJECTION_JOURNAL },
            { orderBy: { sequenceNumber: "ASC" } },
        );
        const pending = events.filter(({ id }) => !props.context.consumed.has(id));
        const projections: Outbox[] = [];
        for await (const event of pending) {
            if (event.actionType === ProjectionScript.CHECKPOINT) {
                expect(projections).toHaveLength(1);
                expect(event.payload).toMatchObject({ realm: projections[0].payload.realm });
                expect(event.sequenceNumber).toBeGreaterThan(projections[0].sequenceNumber);
            } else {
                const script = Object.values(ProjectionScript).find((value) => value === event.actionType);
                if (!script) {
                    throw new Error(`Unknown projection script: ${event.actionType}`);
                }
                const result = await props.executor.execute({
                    args: [JSON.stringify(event.payload)],
                    script,
                });
                expect(result).toBe("OK");
                projections.push(event);
            }
            props.context.consumed.add(event.id);
        }
        expect(projections).toHaveLength(1);
        return projections;
    }

    public pathKey(ancestor: Entities.Role, descendant: Entities.Role, depth: number): string {
        return `${ancestor.id}:${descendant.id}:${depth}`;
    }

    public async loadClosure(
        props: Integration.Projection.Role.LoadClosure.Props,
    ): Integration.Projection.Role.LoadClosure.Result {
        const { transaction, redis, realm } = props;
        const sql = await new PostgresHelpers().getRoleClosurePathKeys({ transaction, realm });
        const descendants: string[] = [];
        const ancestors: string[] = [];
        await Promise.all(
            (await redis.keys(`projection:role-ancestors:${realm}:*`)).map(async (key) => {
                const descendant = key.split(":")[3];
                const members = await redis.zrange(key, "0", "-1", "WITHSCORES");
                for (let index = 0; index < members.length; index += 2) {
                    ancestors.push(`${members[index]}:${descendant}:${members[index + 1]}`);
                }
            }),
        );

        await Promise.all(
            (await redis.keys(`projection:role-descendants:${realm}:*`)).map(async (key) => {
                const ancestor = key.split(":")[3];
                const members = await redis.zrange(key, "0", "-1", "WITHSCORES");
                for (let index = 0; index < members.length; index += 2) {
                    descendants.push(`${ancestor}:${members[index]}:${members[index + 1]}`);
                }
            }),
        );

        return { projected: [ancestors.sort(), descendants.sort()], sql };
    }
}
