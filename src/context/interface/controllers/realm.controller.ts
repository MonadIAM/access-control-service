import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Delete,
    Inject,
    Patch,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, ExtractContext } from "~common/decorators";
import { REALM_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    GetRealmsLookupListQueryDTO,
    GetRealmsLookupListBodyDTO,
    GetRealmByIdQueryDTO,
    GetRealmsListBodyDTO,
    UpdateRealmQueryDTO,
    RestoreRealmBodyDTO,
    RealmLookupListDTO,
    CreateRealmBodyDTO,
    UpdateRealmBodyDTO,
    RevokeRealmBodyDTO,
    PurgeRealmBodyDTO,
    RealmListDTO,
    RealmDTO,
} from "../dto/realm";

@ApiTags("Realm")
@Controller("/realm")
@UseInterceptors(MonitoringInterceptor)
export class RealmController extends BaseController {
    public constructor(
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(REALM_HANDLER)
        private readonly realmHandler: Handlers.Realm.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a realm by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { realm }: GetRealmByIdQueryDTO): Promise<RealmDTO> {
        return this.realmRepository
            .findUniqueOrThrow({ where: { id: realm } })
            .then((data) => super.formatResponse({ DTO: RealmDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of realms" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(@Body() { pagination, filters, sort }: GetRealmsListBodyDTO): Promise<RealmListDTO> {
        return this.realmRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RealmListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a lookup list of realms" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmLookupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getLookupList(
        @Query() { term }: GetRealmsLookupListQueryDTO,
        @Body() { pagination }: GetRealmsLookupListBodyDTO,
    ): Promise<RealmLookupListDTO> {
        return this.realmRepository
            .getLookupList({ pagination, term })
            .then((data) => super.formatResponse({ DTO: RealmLookupListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new realm" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractContext() context: RequestContext,
        @Body() input: CreateRealmBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.realmHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Updates realm metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractContext() context: RequestContext,
        @Query() { id }: UpdateRealmQueryDTO,
        @Body() input: UpdateRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmHandler
            .update({ id, actor: "00000000-0000-4000-8000-000000000000", input, context })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractContext() context: RequestContext,
        @Body() input: RevokeRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractContext() context: RequestContext,
        @Body() input: RestoreRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
