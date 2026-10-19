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
            await this.writeEntityManager.getConnection().execute("SELECT 1");
            await this.readEntityManager.getConnection().execute("SELECT 1");

            return indicator.up();
        } catch {
            return indicator.down({ message: "internal_driver_error" });
        }
    }
}
