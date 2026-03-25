import { Module } from "@nestjs/common";

import { ChangeLogSubscriber } from "./subscribers";
import { OperationContext } from "./utilities";
import { TRACKING_SERVICES } from "./services";

@Module({
    providers: [...TRACKING_SERVICES, ChangeLogSubscriber, OperationContext],
    exports: [...TRACKING_SERVICES, ChangeLogSubscriber],
})
export class TrackingModule {}
