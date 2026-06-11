import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger } from "~common/decorators";
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
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController {
    public constructor(
        @Inject(CHANGE_LOG_QUERIES)
        private readonly changeLogQueries: Queries.ChangeLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ChangeLogDTO)
    @RequirePermission(CHANGE_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ChangeLogDTO })
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
    @RequirePermission(CHANGE_LOG_READ_ABSOLUTE)
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
    public getList(@Body() { pagination, filters, sort }: GetListBodyDTO): Queries.ChangeLog.FindMany.Result {
        return this.changeLogQueries.findMany({ pagination, filters, sort });
    }
}
