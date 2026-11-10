import { jest } from "@jest/globals";

import { LogMaskingService } from "~common/transaction-manager/services/log-masking.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class LogMaskingUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.TransactionManager.LogMasking.Contract
{
    public vault(
        props: Unit.TransactionManager.LogMasking.VaultFactory.Props = {},
    ): Unit.TransactionManager.LogMasking.VaultFactory.Result {
        const hmacBatch = jest.fn(
            props.hmacBatch ?? (({ inputs }) => Promise.resolve(inputs.map((input) => `hmac:${input}`))),
        );
        const sign = jest.fn(props.sign ?? (({ input }) => Promise.resolve({ signature: `sig:${input}`, version: 1 })));

        const signBatch = jest.fn(
            props.signBatch ??
                (({ inputs, version }) => {
                    const signatures: Awaited<CommonServices.VaultTransit.SignBatch.Result> = [];
                    for (const input of inputs) {
                        signatures.push({ signature: `sig:${input}`, version });
                    }
                    return Promise.resolve(signatures);
                }),
        );

        return {
            service: this.contract<CommonServices.VaultTransit.Contract>({
                getLatestVersion: jest.fn(() => Promise.resolve(1)),
                signBatch,
                decrypt: jest.fn(),
                encrypt: jest.fn(),
                getKey: jest.fn(),
                rewrap: jest.fn(),
                hmac: jest.fn(),
                hmacBatch,
                sign,
            }),
            hmacBatch,
            signBatch,
            sign,
        };
    }

    public service(
        props: Unit.TransactionManager.LogMasking.Service.Props = {},
    ): Unit.TransactionManager.LogMasking.Service.Result {
        const vault = props.vault ?? this.vault();
        const service = new LogMaskingService(
            vault.service,
            this.config({
                values: {
                    VAULT_TRANSIT_AUDIT_MASK_KEY: "audit-mask-key",
                    VAULT_TRANSIT_AUDIT_LOG_KEY: "audit-log-key",
                },
            }),
        );

        return { service, vault };
    }

    public auditTargets(): Unit.TransactionManager.LogMasking.AuditTargetsFactory.Result {
        return [];
    }
}
