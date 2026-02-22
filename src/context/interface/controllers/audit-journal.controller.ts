import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { AUDIT_JOURNAL_REPOSITORY } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
import { EndpointExceptions } from "~common/decorators";
import { BaseController } from "~common/abstract";

import {
    GetAuditJournalsListBodyDTO,
    GetAuditJournalByIdQueryDTO,
    AuditJournalListDTO,
    AuditJournalDTO,
} from "../dto/audit-journal";

@ApiTags("AuditJournal")
@Controller("/audit-journal")
@UseInterceptors(MonitoringInterceptor)
export class AuditJournalController extends BaseController {
    public constructor(
        @Inject(AUDIT_JOURNAL_REPOSITORY)
        private readonly auditJournalRepository: Repositories.AuditJournal.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a audit journal event by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditJournalDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { event }: GetAuditJournalByIdQueryDTO): Promise<AuditJournalDTO> {
        return this.auditJournalRepository
            .findUniqueOrThrow({ where: { id: event } })
            .then((data) => super.formatResponse({ DTO: AuditJournalDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of audit journal events" })
    @ApiResponse({ status: HttpStatus.OK, type: AuditJournalListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(@Body() { pagination, filters, sort }: GetAuditJournalsListBodyDTO): Promise<AuditJournalListDTO> {
        return this.auditJournalRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: AuditJournalListDTO, pagination, data }));
    }
}
