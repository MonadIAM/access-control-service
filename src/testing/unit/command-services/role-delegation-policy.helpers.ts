import { jest } from "@jest/globals";

import { RoleDelegationPolicyCommands } from "~context/application/commands/role-delegation-policy.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleDelegationPolicyCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RoleDelegationPolicyCommands.Contract
{
    public commands(): Unit.Application.RoleDelegationPolicyCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.RoleDelegationPolicy.Create.Signature>(),
            update: jest.fn<Services.RoleDelegationPolicy.Update.Signature>(),
            revoke: jest.fn<Services.RoleDelegationPolicy.Revoke.Signature>(),
            restore: jest.fn<Services.RoleDelegationPolicy.Restore.Signature>(),
            purge: jest.fn<Services.RoleDelegationPolicy.Purge.Signature>(),
            expire: jest.fn<Services.RoleDelegationPolicy.Expire.Signature>(),
        };
        const repository = {
            find: jest.fn<Repositories.RoleDelegationPolicy.PublicContract["find"]>(),
        };

        return {
            ...execution,
            service,
            repository,
            commands: new RoleDelegationPolicyCommands(
                execution.transactional,
                this.contract<Repositories.RoleDelegationPolicy.PublicContract>(repository),
                this.contract<Services.RoleDelegationPolicy.CommandContract>(service),
            ),
        };
    }
}
