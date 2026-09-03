import { JWTPayload } from "jose";

declare global {
    namespace Vault {
        type KeyCache = {
            data: Awaited<CommonServices.VaultTransit.GetKey.Result>;
            expiresAt: number;
        };

        type Response<T> = {
            data: T;
        };

        type Key = {
            creation_time: string;
            public_key: string;
        };

        type GetKey = {
            keys: Record<string, Key>;
            latest_version: number;
            type: string;
        };

        type Sign = {
            key_version: number;
            signature: string;
        };

        type SignBatch = {
            batch_results: Sign[];
        };

        type Hmac = {
            hmac: string;
        };

        type HmacBatch = {
            batch_results: Hmac[];
        };

        type Encrypt = {
            key_version: number;
            ciphertext: string;
        };

        type Decrypt = {
            plaintext: string;
        };

        type Rewrap = {
            key_version: number;
            ciphertext: string;
        };
    }

    namespace CommonServices {
        namespace JWT {
            interface Contract extends PublicContract {}

            interface PublicContract {
                verifyAccess: VerifyAccess.Signature;
            }

            namespace VerifyAccess {
                type Props = {
                    token: string;
                };

                type Result = Promise<JWTPayload>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace VaultTransit {
            type KeyVersion = {
                publicKey: string;
                createdAt: string;
                version: number;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                getLatestVersion: GetLatestVersion.Signature;
                decrypt: Decrypt.Signature;
                encrypt: Encrypt.Signature;
                getKey: GetKey.Signature;
                rewrap: Rewrap.Signature;
                sign: Sign.Signature;
                signBatch: SignBatch.Signature;
                hmac: Hmac.Signature;
                hmacBatch: HmacBatch.Signature;
            }

            namespace GetLatestVersion {
                type Props = {
                    name: string;
                };

                type Result = Promise<number>;

                type Signature = (props: Props) => Result;
            }

            namespace Decrypt {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace Encrypt {
                type Props = {
                    plaintext: string;
                    name: string;
                };

                type Result = Promise<{
                    ciphertext: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace GetKey {
                type Props = {
                    name: string;
                };

                type Result = Promise<{
                    versions: KeyVersion[];
                    latestVersion: number;
                    name: string;
                    type: string;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Rewrap {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<{
                    ciphertext: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Sign {
                type Props = {
                    version?: number;
                    input: string;
                    name: string;
                };

                type Result = Promise<{
                    signature: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Hmac {
                type Props = {
                    input: string;
                    name: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace SignBatch {
                type Props = {
                    version: number;
                    inputs: string[];
                    name: string;
                };

                type Result = Promise<{ signature: string; version: number }[]>;

                type Signature = (props: Props) => Result;
            }

            namespace HmacBatch {
                type Props = {
                    inputs: string[];
                    name: string;
                };

                type Result = Promise<string[]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
