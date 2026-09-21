import { jest } from "@jest/globals";

import { RealmCommands } from "~context/application/commands/realm.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RealmCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RealmCommands.Contract
{
    public commands(): Unit.Application.RealmCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.Realm.Create.Signature>(),
            update: jest.fn<Services.Realm.Update.Signature>(),
            revoke: jest.fn<Services.Realm.Revoke.Signature>(),
            restore: jest.fn<Services.Realm.Restore.Signature>(),
            purge: jest.fn<Services.Realm.Purge.Signature>(),
            bootstrapOrganization: jest.fn<Services.Realm.BootstrapOrganization.Signature>(),
            bootstrapProject: jest.fn<Services.Realm.BootstrapProject.Signature>(),
            transferOwnership: jest.fn<Services.Realm.TransferOwnership.Signature>(),
            revokeBySystem: jest.fn<Services.Realm.RevokeBySystem.Signature>(),
            restoreBySystem: jest.fn<Services.Realm.RestoreBySystem.Signature>(),
            purgeBySystem: jest.fn<Services.Realm.PurgeBySystem.Signature>(),
            purgeAccountAccess: jest.fn<Services.Realm.PurgeAccountAccess.Signature>(),
            revokeAccountAccess: jest.fn<Services.Realm.RevokeAccountAccess.Signature>(),
            restoreAccountAccess: jest.fn<Services.Realm.RestoreAccountAccess.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RealmCommands(execution.transactional, this.contract<Services.Realm.CommandContract>(service)),
        };
    }
}
