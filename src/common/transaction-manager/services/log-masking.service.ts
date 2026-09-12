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
        PII: ["identity", "identities", "email", "emails", "phone", "phones"],
        SECRET: [
            "recoveryCodes",
            "recoveryCode",
            "masterCodes",
            "masterCode",
            "passwords",
            "password",
            "secrets",
            "secret",
            "hashes",
            "tokens",
            "token",
            "hash",
            "totp",
            "otp",
        ],
    };

    private readonly SENSITIVE_FIELDS = new Set(
        this.FIELD_CLASSIFICATION.SECRET.concat(this.FIELD_CLASSIFICATION.PII).map((field) => this.normalize(field)),
    );

    private readonly SENSITIVE_FIELD_SUFFIXES = this.FIELD_CLASSIFICATION.SECRET.concat(this.FIELD_CLASSIFICATION.PII).map(
        (field) => this.normalize(field),
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

            if (hashes.length === targets.length) {
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
                throw new Error("Vault HMAC response does not match sensitive target count");
            }
        } else {
            return props.input;
        }
    }

    public async maskChangeLog(
        props: TransactionManager.LogMasking.MaskChangeLog.Props,
    ): TransactionManager.LogMasking.MaskChangeLog.Result {
        const targets: TransactionManager.LogMasking.ChangeTarget[] = [];

        for (const [field, change] of Object.entries(props.delta)) {
            if (this.isSensitiveField(field)) {
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

            if (hashes.length === targets.length) {
                const record: ValueObjects.DeltaChanges.ConstructorProps = { ...props.delta };
                targets.forEach((target, index) => {
                    record[target.field] = {
                        ...record[target.field],
                        [target.kind]: new MaskedValue({ value: this.mask(target.value), hash: hashes[index] }),
                    };
                });

                return new DeltaChanges(record);
            } else {
                throw new Error("Vault HMAC response does not match sensitive target count");
            }
        } else {
            return props.delta;
        }
    }

    public async sign(props: TransactionManager.LogMasking.Sign.Props): TransactionManager.LogMasking.Sign.Result {
        const { signature, version } = await this.vaultTransitService.sign({
            input: JSON.stringify(this.serializeForSigning(props.entity)),
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
        const { node, targets, path = [], sensitive = false } = props;

        if (isString(node)) {
            if (sensitive) {
                targets.push({ path, value: node });
            }
        } else if (isArray(node)) {
            node.forEach((item, index) => this.flatten({ node: item, targets, path: [...path, index], sensitive }));
        } else if (isObject(node)) {
            for (const [field, value] of Object.entries(node)) {
                this.flatten({
                    sensitive: sensitive || this.isSensitiveField(field),
                    path: [...path, field],
                    targets,
                    node: value,
                });
            }
        }
    }

    public mask(props: TransactionManager.LogMasking.Mask.Props): TransactionManager.LogMasking.Mask.Result {
        if (isPhoneNumber(props)) {
            const phone = parsePhoneNumber(props);
            return `+${phone.countryCallingCode}${"*".repeat(Math.max(phone.nationalNumber.length - 2, 0))}${phone.nationalNumber.slice(-2)}`;
        } else if (isEmail(props)) {
            const [localPart, domain] = props.split("@");
            return `${localPart.slice(0, 2)}${"*".repeat(8)}@${domain}`;
        } else {
            return "*".repeat(16);
        }
    }

    private isSensitiveField(field: string): boolean {
        const normalized = this.normalize(field);
        return (
            this.SENSITIVE_FIELDS.has(normalized) ||
            this.SENSITIVE_FIELD_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
        );
    }

    private serializeForSigning(value: unknown): unknown {
        if (value instanceof Date) {
            return value.toISOString();
        } else if (isArray(value)) {
            return value.map((item) => this.serializeForSigning(item));
        } else if (isObject(value)) {
            const source = value as UnknownObject;
            const record: UnknownObject = {};
            for (const key of Object.keys(source).sort()) {
                if (key !== "signature" && key !== "keyVersion" && source[key] !== undefined) {
                    record[key] = this.serializeForSigning(source[key]);
                }
            }
            return record;
        } else {
            return value;
        }
    }
}
