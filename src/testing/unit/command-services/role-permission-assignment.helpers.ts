import { jest } from "@jest/globals";

import { RolePermissionAssignmentCommands } from "~context/application/commands/role-permission-assignment.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RolePermissionAssignmentCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RolePermissionAssignmentCommands.Contract
{
    public commands(): Unit.Application.RolePermissionAssignmentCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.RolePermissionAssignment.Create.Signature>(),
            revoke: jest.fn<Services.RolePermissionAssignment.Revoke.Signature>(),
            restore: jest.fn<Services.RolePermissionAssignment.Restore.Signature>(),
            purge: jest.fn<Services.RolePermissionAssignment.Purge.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RolePermissionAssignmentCommands(
                execution.transactional,
                this.contract<Services.RolePermissionAssignment.CommandContract>(service),
            ),
        };
    }
}
