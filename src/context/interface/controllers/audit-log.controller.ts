import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { EndpointExceptions, FormatResponse, RequirePermission } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { AUDIT_LOG_QUERY } from "~context/application/query";
import { PermissionCode } from "~context/enums";

import { GetAuditLogsListBodyDTO, GetAuditLogByIdQueryDTO, AuditLogListDTO, AuditLogDTO } from "../dto/audit-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;
const { AUDIT_LOG_READ_ABSOLUTE } = PermissionCode;

@ApiTags("AuditLog")
@Controller("/audit-log")
@UseInterceptors(MonitoringInterceptor)
export class AuditLogController {
    public constructor(
        @Inject(AUDIT_LOG_QUERY)
        private readonly auditLogQuery: Queries.AuditLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AuditLogDTO)
    @RequirePermission(AUDIT_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: AuditLogDTO })
    @ApiOperation({ summary: "Returns a audit log by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public findUnique(@Query() { log }: GetAuditLogByIdQueryDTO): Promise<Repositories.AuditLog.Entity> {
        return this.auditLogQuery.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(AuditLogListDTO)
    @RequirePermission(AUDIT_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: AuditLogListDTO })
    @ApiOperation({ summary: "Returns a paginated list of audit logs" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetAuditLogsListBodyDTO,
    ): Promise<[Repositories.AuditLog.Entity[], number]> {
        return this.auditLogQuery.findMany({ pagination, filters, sort });
    }
}
