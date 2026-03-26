import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { REALM_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
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
export class RealmController {
    public constructor(
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(REALM_OPERATION)
        private readonly realmOperation: Operations.Realm.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RealmDTO)
    @RequirePermission(PermissionCode.REALM_READ)
    @ApiOperation({ summary: "Returns a realm by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { realm }: GetRealmByIdQueryDTO): Promise<Repositories.Realm.Entity> {
        return this.realmRepository.findUniqueOrThrow({ where: { id: realm } });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RealmListDTO)
    @RequirePermission(PermissionCode.REALM_READ)
    @ApiOperation({ summary: "Returns a paginated list of realms" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Body() { pagination, filters, sort }: GetRealmsListBodyDTO,
    ): Promise<[Repositories.Realm.Entity[], number]> {
        return this.realmRepository.findMany({ pagination, filters, sort });
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RealmLookupListDTO)
    @RequirePermission(PermissionCode.REALM_READ)
    @ApiOperation({ summary: "Returns a lookup list of realms" })
    @ApiResponse({ status: HttpStatus.OK, type: RealmLookupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getLookupList(
        @Query() { term }: GetRealmsLookupListQueryDTO,
        @Body() { pagination }: GetRealmsLookupListBodyDTO,
    ): Promise<[Repositories.Realm.Entity[], number]> {
        return this.realmRepository.getLookupList({ pagination, term });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
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
    ): Promise<MessageResult> {
        return this.realmOperation.create({ actor, context, input });
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.REALM_UPDATE)
    @ApiOperation({ summary: "Updates realm metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { id }: UpdateRealmQueryDTO,
        @Body() input: UpdateRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.update({ actor, context, input, id });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.REALM_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RevokeRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.revoke({ actor, context, input });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.REALM_RESTORE)
    @ApiOperation({ summary: "Restores a non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RestoreRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.restore({ actor, context, input });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.REALM_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system realm/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.purge({ actor, context, input });
    }
}
