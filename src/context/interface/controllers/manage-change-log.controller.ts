import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { CHANGE_LOG_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetListBodyDTO, GetByIdQueryDTO, ChangeLogDTO, ListDTO } from "../dto/change-log";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    OK,
} = HttpStatus;
const { CHANGE_LOG_READ_ABSOLUTE } = PermissionCode;

@ApiTags("ChangeLog")
@Controller("/change-log/manage")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogManageController {
    public constructor(
        @Inject(CHANGE_LOG_QUERIES)
        private readonly changeLogQueries: Queries.ChangeLog.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ChangeLogDTO)
    @ApiResponse({ status: OK, type: ChangeLogDTO })
    @RequireGlobalPermission(CHANGE_LOG_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a change log by identifier",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        NOT_FOUND,
    )
    public findUnique(@Query() { log }: GetByIdQueryDTO): Queries.ChangeLog.FindUnique.Result {
        return this.changeLogQueries.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(CHANGE_LOG_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of change logs",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(@Body() { pagination, filters, sort }: GetListBodyDTO): Queries.ChangeLog.FindMany.Result {
        return this.changeLogQueries.findMany({ pagination, filters, sort });
    }
}
