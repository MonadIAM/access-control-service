import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectMikroORM } from "@mikro-orm/nestjs";
import { MikroORM } from "@mikro-orm/postgresql";
import { readFile } from "node:fs/promises";
import { watch, FSWatcher } from "node:fs";

@Injectable()
export class CredentialsWatcher implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CredentialsWatcher.name);

    private readonly secretsDir = "/vault/secrets";
    private readonly usernamePath = `${this.secretsDir}/postgresql_username`;
    private readonly passwordPath = `${this.secretsDir}/postgresql_password`;
    private readonly debounceMs = 2e3;

    private debounceTimer?: NodeJS.Timeout;
    private lastUsername?: string;
    private lastPassword?: string;
    private watcher?: FSWatcher;

    public constructor(
        @InjectMikroORM("write")
        private readonly writeORM: MikroORM,
        @InjectMikroORM("read")
        private readonly readORM: MikroORM,
    ) {}

    public async onModuleInit(): Promise<void> {
        this.lastUsername = (await readFile(this.usernamePath, "utf8")).trim();
        this.lastPassword = (await readFile(this.passwordPath, "utf8")).trim();

        this.watcher = watch(this.secretsDir, () => {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(() => {
                this.handleChange().catch((error: unknown) => {
                    this.logger.error(`Failed to reload PostgreSQL credentials: ${error}`);
                });
            }, this.debounceMs);
        });
    }

    public onModuleDestroy(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.watcher?.close();
    }

    private async handleChange(): Promise<void> {
        const username = (await readFile(this.usernamePath, "utf8")).trim();
        const password = (await readFile(this.passwordPath, "utf8")).trim();

        if (username !== this.lastUsername || password !== this.lastPassword) {
            this.lastUsername = username;
            this.lastPassword = password;

            await this.writeORM.reconnect({ user: username, password });
            await this.readORM.reconnect({ user: username, password });

            this.logger.log("PostgreSQL credentials rotated, reconnected.");
        }
    }
}
