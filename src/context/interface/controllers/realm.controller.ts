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

import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { REALM_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { REALM_QUERY } from "~context/application/query";
import { PermissionCode } from "~context/enums";
import {
    ExtractPermissions,
    EndpointExceptions,
    RequirePermission,
    ExtractContext,
    FormatResponse,
    ExtractActor,
} from "~common/decorators";

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

const { REALM_READ_PERSONAL, REALM_READ_ABSOLUTE, REALM_RESTORE, REALM_CREATE, REALM_UPDATE, REALM_REVOKE, REALM_PURGE } =
    PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    CREATED,
    OK,
} = HttpStatus;

@ApiTags("Realm")
@Controller("/realm")
@UseInterceptors(MonitoringInterceptor)
export class RealmController {
    public constructor(
        @Inject(REALM_OPERATION)
        private readonly realmOperation: Operations.Realm.Contract,
        @Inject(REALM_QUERY)
        private readonly realmQuery: Queries.Realm.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RealmDTO)
    @ApiResponse({ status: OK, type: RealmDTO })
    @ApiOperation({ summary: "Returns a realm by identifier" })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { realm, view }: GetRealmByIdQueryDTO,
        @ExtractActor() { account }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<Repositories.Realm.Entity> {
        return this.realmQuery.findUnique({ permissions, account, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(RealmListDTO)
    @ApiResponse({ status: OK, type: RealmListDTO })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a paginated list of realms" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetRealmsListBodyDTO,
        @ExtractActor() { account }: ActorContext,
        @Query() { view }: BaseReadQueryDTO,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Repositories.Realm.Entity[], number]> {
        return this.realmQuery.findMany({ permissions, pagination, filters, account, view, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(RealmLookupListDTO)
    @ApiResponse({ status: OK, type: RealmLookupListDTO })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a lookup list of realms" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Body() { pagination }: GetRealmsLookupListBodyDTO,
        @Query() { term }: GetRealmsLookupListQueryDTO,
        @ExtractActor() { account }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Repositories.Realm.Entity[], number]> {
        return this.realmQuery.getLookupList({ permissions, pagination, account, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequirePermission(REALM_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Creates a new realm" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: CreateRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(REALM_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Updates realm metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { id }: UpdateRealmQueryDTO,
        @Body() input: UpdateRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.update({ context, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @RequirePermission(REALM_REVOKE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system realm(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RevokeRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.revoke({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequirePermission(REALM_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system realm(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: RestoreRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.restore({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @RequirePermission(REALM_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system realm(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeRealmBodyDTO,
    ): Promise<MessageResult> {
        return this.realmOperation.purge({ context, actor, input });
    }
}
