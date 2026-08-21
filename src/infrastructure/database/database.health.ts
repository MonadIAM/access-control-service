import { HealthIndicatorService, HealthIndicatorResult } from "@nestjs/terminus";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DatabaseHealthIndicator {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeEntityManager: ORM.EntityManager,
        @InjectEntityManager("read")
        private readonly readEntityManager: ORM.EntityManager,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    public async isHealthy<T extends string>(key: T): Promise<HealthIndicatorResult<T>> {
        const indicator = this.healthIndicatorService.check(key);
        try {
            await this.assertConnection(this.writeEntityManager);
            await this.assertConnection(this.readEntityManager);

            return indicator.up();
        } catch (error) {
            return indicator.down({
                message:
                    error instanceof Error && error.message === "connection_lost"
                        ? "connection_lost"
                        : "internal_driver_error",
            });
        }
    }

    private async assertConnection(entityManager: ORM.EntityManager): Promise<void> {
        const isConnected = await entityManager.getConnection().isConnected();
        if (isConnected) {
            await entityManager.getConnection().execute("SELECT 1");
        } else {
            throw new Error("Connection lost");
        }
    }
}
