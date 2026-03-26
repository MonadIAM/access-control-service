import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, FormatResponse, RequirePermission } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetAuditLogsListBodyDTO, GetAuditLogByIdQueryDTO, AuditLogListDTO, AuditLogDTO } from "../dto/audit-log";

@ApiTags("AuditLog")
@Controller("/audit-log")
@UseInterceptors(MonitoringInterceptor)
export class AuditLogController {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.AuditLog.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(AuditLogDTO)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a audit log by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditLogDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { log }: GetAuditLogByIdQueryDTO): Promise<Repositories.AuditLog.Entity> {
        return this.auditLogRepository.findUniqueOrThrow({ where: { id: log } });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(AuditLogListDTO)
    @RequirePermission(PermissionCode.AUDIT_JOURNAL_READ)
    @ApiOperation({ summary: "Returns a paginated list of audit logs" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditLogListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Body() { pagination, filters, sort }: GetAuditLogsListBodyDTO,
    ): Promise<[Repositories.AuditLog.Entity[], number]> {
        return this.auditLogRepository.findMany({ pagination, filters, sort });
    }
}
