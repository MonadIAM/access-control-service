import { PrometheusController } from "@willsoto/nestjs-prometheus";
import { ApiExcludeController } from "@nestjs/swagger";
import { Controller, Get, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { SkipInterceptors, Public } from "~common/decorators";

@Controller()
@SkipThrottle()
@SkipInterceptors()
@ApiExcludeController()
export class MetricsController extends PrometheusController {
    @Get()
    @Public()
    public override index(@Res({ passthrough: true }) response: Response): Promise<string> {
        return super.index(response);
    }
}
