import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RealmRepository } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRealmsLookupListQueryDTO,
    GetRealmsLookupListBodyDTO,
    GetRealmByIdQueryDTO,
    GetRealmsListBodyDTO,
    RealmLookupListDTO,
    RealmListDTO,
    RealmDTO,
} from "../dto/realm";

@ApiTags("Realm")
@Controller("/realm")
@UseInterceptors(MonitoringInterceptor)
export class RealmController extends BaseController {
    public constructor(
        private readonly realmRepository: RealmRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a realm by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RealmDTO })
    public getById(@Query() { realm }: GetRealmByIdQueryDTO): Promise<RealmDTO> {
        return this.realmRepository
            .findUniqueOrThrow({ where: { id: realm } })
            .then((data) => super.formatResponse({ DTO: RealmDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of realms" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RealmListDTO })
    public getList(@Body() { pagination, filters, sort }: GetRealmsListBodyDTO): Promise<RealmListDTO> {
        return this.realmRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RealmListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a lookup list of realms" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RealmLookupListDTO })
    public getLookupList(
        @Query() { term }: GetRealmsLookupListQueryDTO,
        @Body() { pagination }: GetRealmsLookupListBodyDTO,
    ): Promise<RealmLookupListDTO> {
        return this.realmRepository
            .getLookupList({ pagination, term })
            .then((data) => super.formatResponse({ DTO: RealmLookupListDTO, pagination, data }));
    }
}
