import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, RequirePermission } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { PermissionCode } from "~context/enums";

import { GetChangeLogsListBodyDTO, GetChangeLogByIdQueryDTO, ChangeLogListDTO, ChangeLogDTO } from "../dto/change-log";

@ApiTags("ChangeLog")
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController extends BaseController {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.ChangeLog.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a change log by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: ChangeLogDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { log }: GetChangeLogByIdQueryDTO): Promise<ChangeLogDTO> {
        return this.auditLogRepository
            .findUniqueOrThrow({ where: { id: log } })
            .then((data) => super.formatResponse({ DTO: ChangeLogDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a paginated list of change logs" })
    @ApiResponse({ status: HttpStatus.OK, type: ChangeLogListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(@Body() { pagination, filters, sort }: GetChangeLogsListBodyDTO): Promise<ChangeLogListDTO> {
        return this.auditLogRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: ChangeLogListDTO, pagination, data }));
    }
}
