import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger } from "~common/decorators";
import { AUDIT_LOG_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetListBodyDTO, GetByIdQueryDTO, AuditLogDTO, ListDTO } from "../dto/audit-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;
const { AUDIT_LOG_READ_ABSOLUTE } = PermissionCode;

@ApiTags("AuditLog")
@Controller("/audit-log")
@UseInterceptors(MonitoringInterceptor)
export class AuditLogController {
    public constructor(
        @Inject(AUDIT_LOG_QUERIES)
        private readonly auditLogQueries: Queries.AuditLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AuditLogDTO)
    @RequirePermission(AUDIT_LOG_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: AuditLogDTO })
    @ApiOperation({ summary: "Returns a audit log by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public findUnique(@Query() { log }: GetByIdQueryDTO): Queries.AuditLog.FindUnique.Result {
        return this.auditLogQueries.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(AUDIT_LOG_READ_ABSOLUTE)
    @ApiOperation({ summary: "Returns a paginated list of audit logs" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(@Body() { pagination, filters, sort }: GetListBodyDTO): Queries.AuditLog.FindMany.Result {
        return this.auditLogQueries.findMany({ pagination, filters, sort });
    }
}
