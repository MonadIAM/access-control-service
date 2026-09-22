import { jest } from "@jest/globals";

import { RoleDelegationPolicyCommands } from "~context/application/commands/role-delegation-policy.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleDelegationPolicyCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.RoleDelegationPolicy.Contract
{
    public commands(): Unit.Commands.RoleDelegationPolicy.Commands.Result {
        const execution = this.execution();

        const service = {
            restore: jest.fn<Services.RoleDelegationPolicy.Restore.Signature>(),
            create: jest.fn<Services.RoleDelegationPolicy.Create.Signature>(),
            update: jest.fn<Services.RoleDelegationPolicy.Update.Signature>(),
            revoke: jest.fn<Services.RoleDelegationPolicy.Revoke.Signature>(),
            expire: jest.fn<Services.RoleDelegationPolicy.Expire.Signature>(),
            purge: jest.fn<Services.RoleDelegationPolicy.Purge.Signature>(),
        };
        const repository = {
            find: jest.fn<Repositories.RoleDelegationPolicy.PublicContract["find"]>(),
        };

        return {
            ...execution,
            repository,
            service,
            commands: new RoleDelegationPolicyCommands(
                execution.transactional,
                this.contract<Repositories.RoleDelegationPolicy.PublicContract>(repository),
                this.contract<Services.RoleDelegationPolicy.CommandContract>(service),
            ),
        };
    }
}
