import { jest } from "@jest/globals";

import { RoleCommands } from "~context/application/commands/role.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleCommandsUnitHelpers extends ApplicationCommandUnitHelpers implements Unit.Commands.Role.Contract {
    public commands(): Unit.Commands.Role.Commands.Result {
        const execution = this.execution();

        const service = {
            purgeSubtree: jest.fn<Services.Role.PurgeSubtree.Signature>(),
            restore: jest.fn<Services.Role.Restore.Signature>(),
            create: jest.fn<Services.Role.Create.Signature>(),
            update: jest.fn<Services.Role.Update.Signature>(),
            revoke: jest.fn<Services.Role.Revoke.Signature>(),
            purge: jest.fn<Services.Role.Purge.Signature>(),
            move: jest.fn<Services.Role.Move.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RoleCommands(execution.transactional, this.contract<Services.Role.CommandContract>(service)),
        };
    }
}
