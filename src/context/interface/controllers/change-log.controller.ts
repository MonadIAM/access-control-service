import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, FormatResponse, RequirePermission } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetChangeLogsListBodyDTO, GetChangeLogByIdQueryDTO, ChangeLogListDTO, ChangeLogDTO } from "../dto/change-log";

@ApiTags("ChangeLog")
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.ChangeLog.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(ChangeLogDTO)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a change log by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: ChangeLogDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { log }: GetChangeLogByIdQueryDTO): Promise<Repositories.ChangeLog.Entity> {
        return this.auditLogRepository.findUniqueOrThrow({ where: { id: log } });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(ChangeLogListDTO)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a paginated list of change logs" })
    @ApiResponse({ status: HttpStatus.OK, type: ChangeLogListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Body() { pagination, filters, sort }: GetChangeLogsListBodyDTO,
    ): Promise<[Repositories.ChangeLog.Entity[], number]> {
        return this.auditLogRepository.findMany({ pagination, filters, sort });
    }
}
