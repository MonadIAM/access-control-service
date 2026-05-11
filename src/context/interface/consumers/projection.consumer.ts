import { EventPattern, Payload } from "@nestjs/microservices";
import { Controller, Inject } from "@nestjs/common";

import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services/tokens";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ProjectionConsumer implements Consumers.Projection.Contract {
    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
    ) {}

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(@Payload() message: Consumers.Projection.Payload): Promise<void> {
        await this.scriptExecutorService.execute<string>(message.operationType, [], [message.payload]);
    }
}
