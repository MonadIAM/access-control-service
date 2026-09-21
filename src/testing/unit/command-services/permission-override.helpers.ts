import { jest } from "@jest/globals";

import { PermissionOverrideCommands } from "~context/application/commands/permission-override.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class PermissionOverrideCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.PermissionOverrideCommands.Contract
{
    public commands(): Unit.Application.PermissionOverrideCommands.Commands.Result {
        const execution = this.execution();

        const repository = {
            find: jest.fn<Repositories.PermissionOverride.PublicContract["find"]>(),
        };
        const cache = {
            checkRealm: jest.fn<InfrastructureServices.ProjectionCache.CheckRealm.Signature>(),
        };
        const service = {
            restore: jest.fn<Services.PermissionOverride.Restore.Signature>(),
            create: jest.fn<Services.PermissionOverride.Create.Signature>(),
            revoke: jest.fn<Services.PermissionOverride.Revoke.Signature>(),
            expire: jest.fn<Services.PermissionOverride.Expire.Signature>(),
            purge: jest.fn<Services.PermissionOverride.Purge.Signature>(),
        };

        return {
            ...execution,
            repository,
            service,
            cache,
            commands: new PermissionOverrideCommands(
                execution.transactional,
                this.contract<Repositories.PermissionOverride.PublicContract>(repository),
                this.contract<Services.PermissionOverride.CommandContract>(service),
                this.contract<InfrastructureServices.ProjectionCache.PublicContract>(cache),
            ),
        };
    }
}
