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

import { EndpointExceptions, ExtractActor, ExtractContext, RequirePermission } from "~common/decorators";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { REALM_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

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
        @Inject(REALM_OPERATION)
        private readonly realmOperation: Operations.Realm.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.REALM_READ)
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
    @RequirePermission(PermissionCode.REALM_READ)
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
    @RequirePermission(PermissionCode.REALM_READ)
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
    @RequirePermission(PermissionCode.REALM_CREATE)
    @ApiOperation({ summary: "Creates a new realm" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: CreateRealmBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.realmOperation
            .create({ actor, context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.REALM_UPDATE)
    @ApiOperation({ summary: "Updates realm metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { id }: UpdateRealmQueryDTO,
        @Body() input: UpdateRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmOperation
            .update({ actor, context, input, id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.REALM_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RevokeRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmOperation
            .revoke({ actor, context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.REALM_RESTORE)
    @ApiOperation({ summary: "Restores a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RestoreRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmOperation
            .restore({ actor, context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.REALM_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeRealmBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.realmOperation
            .purge({ actor, context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
