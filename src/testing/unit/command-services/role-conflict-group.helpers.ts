import { jest } from "@jest/globals";

import { RoleConflictGroupCommands } from "~context/application/commands/role-conflict-group.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleConflictGroupCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RoleConflictGroupCommands.Contract
{
    public commands(): Unit.Application.RoleConflictGroupCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.RoleConflictGroup.Create.Signature>(),
            update: jest.fn<Services.RoleConflictGroup.Update.Signature>(),
            revoke: jest.fn<Services.RoleConflictGroup.Revoke.Signature>(),
            restore: jest.fn<Services.RoleConflictGroup.Restore.Signature>(),
            purge: jest.fn<Services.RoleConflictGroup.Purge.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RoleConflictGroupCommands(
                execution.transactional,
                this.contract<Services.RoleConflictGroup.CommandContract>(service),
            ),
        };
    }
}
