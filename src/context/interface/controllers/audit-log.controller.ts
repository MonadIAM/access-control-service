import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, RequirePermission } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { PermissionCode } from "~context/enums";

import { GetAuditLogsListBodyDTO, GetAuditLogByIdQueryDTO, AuditLogListDTO, AuditLogDTO } from "../dto/audit-log";

@ApiTags("AuditLog")
@Controller("/audit-log")
@UseInterceptors(MonitoringInterceptor)
export class AuditLogController extends BaseController {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.AuditLog.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a audit log by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditLogDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { log }: GetAuditLogByIdQueryDTO): Promise<AuditLogDTO> {
        return this.auditLogRepository
            .findUniqueOrThrow({ where: { id: log } })
            .then((data) => super.formatResponse({ DTO: AuditLogDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a paginated list of audit logs" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditLogListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(@Body() { pagination, filters, sort }: GetAuditLogsListBodyDTO): Promise<AuditLogListDTO> {
        return this.auditLogRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: AuditLogListDTO, pagination, data }));
    }
}
