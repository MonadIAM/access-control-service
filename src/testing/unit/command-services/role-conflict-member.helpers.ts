import { jest } from "@jest/globals";

import { RoleConflictMemberCommands } from "~context/application/commands/role-conflict-member.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleConflictMemberCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.RoleConflictMember.Contract
{
    public commands(): Unit.Commands.RoleConflictMember.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.RoleConflictMember.Create.Signature>(),
            purge: jest.fn<Services.RoleConflictMember.Purge.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RoleConflictMemberCommands(
                execution.transactional,
                this.contract<Services.RoleConflictMember.CommandContract>(service),
            ),
        };
    }
}
