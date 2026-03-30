import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { EndpointExceptions, FormatResponse, RequirePermission } from "~common/decorators";
import { CHANGE_LOG_QUERY } from "~context/application/query";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetChangeLogsListBodyDTO, GetChangeLogByIdQueryDTO, ChangeLogListDTO, ChangeLogDTO } from "../dto/change-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;
const { CHANGE_LOG_READ_ABSOLUTE } = PermissionCode;

@ApiTags("ChangeLog")
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController {
    public constructor(
        @Inject(CHANGE_LOG_QUERY)
        private readonly changeLogQuery: Queries.ChangeLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ChangeLogDTO)
    @RequirePermission(CHANGE_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ChangeLogDTO })
    @ApiOperation({ summary: "Returns a change log by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public findUnique(@Query() { log }: GetChangeLogByIdQueryDTO): Promise<Repositories.ChangeLog.Entity> {
        return this.changeLogQuery.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ChangeLogListDTO)
    @RequirePermission(CHANGE_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ChangeLogListDTO })
    @ApiOperation({ summary: "Returns a paginated list of change logs" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetChangeLogsListBodyDTO,
    ): Promise<[Repositories.ChangeLog.Entity[], number]> {
        return this.changeLogQuery.findMany({ pagination, filters, sort });
    }
}
