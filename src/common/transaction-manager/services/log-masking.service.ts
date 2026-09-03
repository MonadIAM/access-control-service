import { isString, isArray, isEmail, isPhoneNumber, isObject } from "class-validator";
import { parsePhoneNumber } from "libphonenumber-js/max";
import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { VAULT_TRANSIT_SERVICE } from "~common/services/tokens";

import { DeltaChanges, MaskedValue } from "../value-objects";

@Injectable()
export class LogMaskingService implements TransactionManager.LogMasking.Contract {
    private readonly maskKey: string;
    private readonly logKey: string;

    private readonly FIELD_CLASSIFICATION: TransactionManager.LogMasking.FieldClassification = {
        SECRET: ["recoveryCode", "masterCode", "password", "secret", "token", "hash", "totp", "otp"],
        PII: ["identity", "email", "phone"],
    };

    private readonly SENSITIVE_PATTERN = new RegExp(
        this.FIELD_CLASSIFICATION.SECRET.concat(this.FIELD_CLASSIFICATION.PII).map(this.normalize).join("|"),
    );

    public constructor(
        @Inject(VAULT_TRANSIT_SERVICE)
        private readonly vaultTransitService: CommonServices.VaultTransit.Contract,
        private readonly config: ConfigService,
    ) {
        this.maskKey = this.config.getOrThrow<string>("VAULT_TRANSIT_AUDIT_MASK_KEY");
        this.logKey = this.config.getOrThrow<string>("VAULT_TRANSIT_AUDIT_LOG_KEY");
    }

    public async maskAuditLog(
        props: TransactionManager.LogMasking.MaskAuditLog.Props,
    ): TransactionManager.LogMasking.MaskAuditLog.Result {
        const targets: TransactionManager.LogMasking.AuditTarget[] = [];
        this.flatten({ node: props.input, targets });

        if (targets.length) {
            const hashes = await this.vaultTransitService.hmacBatch({
                inputs: targets.map((target) => target.value),
                name: this.maskKey,
            });

            const result: UnknownObject = JSON.parse(JSON.stringify(props.input));
            targets.forEach((target, index) => {
                this.unflatten({
                    value: new MaskedValue({ value: this.mask(target.value), hash: hashes[index] }),
                    path: target.path,
                    node: result,
                });
            });

            return result;
        } else {
            return props.input;
        }
    }

    public async maskChangeLog(
        props: TransactionManager.LogMasking.MaskChangeLog.Props,
    ): TransactionManager.LogMasking.MaskChangeLog.Result {
        const targets: TransactionManager.LogMasking.ChangeTarget[] = [];

        for (const [field, change] of Object.entries(props.delta)) {
            if (this.SENSITIVE_PATTERN.test(this.normalize(field))) {
                if (isString(change.old)) {
                    targets.push({ field, kind: "old", value: change.old });
                }
                if (isString(change.new)) {
                    targets.push({ field, kind: "new", value: change.new });
                }
            }
        }

        if (targets.length) {
            const hashes = await this.vaultTransitService.hmacBatch({
                inputs: targets.map((target) => target.value),
                name: this.maskKey,
            });

            const record: ValueObjects.DeltaChanges.ConstructorProps = { ...props.delta };
            targets.forEach((target, index) => {
                record[target.field] = {
                    ...record[target.field],
                    [target.kind]: new MaskedValue({ value: this.mask(target.value), hash: hashes[index] }),
                };
            });

            return new DeltaChanges(record);
        } else {
            return props.delta;
        }
    }

    public async sign(props: TransactionManager.LogMasking.Sign.Props): TransactionManager.LogMasking.Sign.Result {
        const { signature, version } = await this.vaultTransitService.sign({
            input: JSON.stringify(props.entity, Object.keys(props.entity).sort()),
            name: this.logKey,
        });

        return { signature, keyVersion: version };
    }

    public normalize(props: TransactionManager.LogMasking.Normalize.Props): TransactionManager.LogMasking.Normalize.Result {
        return `_${props.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()}_`;
    }

    public unflatten(props: TransactionManager.LogMasking.Unflatten.Props): TransactionManager.LogMasking.Unflatten.Result {
        const { node, path, value } = props;

        if (isObject(node) || isArray(node)) {
            const container = node as UnknownObject;
            const [key, ...rest] = path;

            if (rest.length) {
                this.unflatten({ node: container[key], path: rest, value });
            } else {
                container[key] = value;
            }
        }
    }

    public flatten(props: TransactionManager.LogMasking.Flatten.Props): TransactionManager.LogMasking.Flatten.Result {
        const { node, targets, path = [] } = props;

        if (isArray(node)) {
            node.forEach((item, index) => this.flatten({ node: item, targets, path: [...path, index] }));
        } else if (isObject(node)) {
            for (const [field, value] of Object.entries(node)) {
                if (!this.SENSITIVE_PATTERN.test(this.normalize(field))) {
                    this.flatten({ node: value, targets, path: [...path, field] });
                } else if (isString(value)) {
                    targets.push({ path: [...path, field], value });
                } else if (isArray(value)) {
                    value.forEach((item, index) => {
                        if (isString(item)) {
                            targets.push({ path: [...path, field, index], value: item });
                        }
                    });
                }
            }
        }
    }

    public mask(props: TransactionManager.LogMasking.Mask.Props): TransactionManager.LogMasking.Mask.Result {
        if (isPhoneNumber(props)) {
            const phone = parsePhoneNumber(props);
            return `+${phone.countryCallingCode}${"*".repeat(phone.nationalNumber.length - 2)}${phone.nationalNumber.slice(-2)}`;
        } else if (isEmail(props)) {
            return props.replace(/^(.{2}).*@(.+)$/, `$1${"*".repeat(8)}@$2`);
        } else {
            return "*".repeat(16);
        }
    }
}
