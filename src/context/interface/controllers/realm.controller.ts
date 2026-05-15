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

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { REALM_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { REALM_QUERIES } from "~context/application/queries";
import { PermissionCode } from "~context/enums";

import {
    GetLookupListQueryDTO,
    GetLookupListBodyDTO,
    GetByIdQueryDTO,
    GetListBodyDTO,
    UpdateQueryDTO,
    RestoreBodyDTO,
    LookupListDTO,
    CreateBodyDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    PurgeBodyDTO,
    RealmDTO,
    ListDTO,
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
        @Inject(REALM_COMMANDS)
        private readonly realmCommands: Commands.Realm.ControllerContract,
        @Inject(REALM_QUERIES)
        private readonly realmQueries: Queries.Realm.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RealmDTO)
    @ApiResponse({ status: OK, type: RealmDTO })
    @ApiOperation({ summary: "Returns a realm by identifier" })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { realm, view }: GetByIdQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Promise<Queries.Realm.Entity> {
        return this.realmQueries.findUnique({ permissions, account, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a paginated list of realms" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
        @Query() { view }: BaseReadQueryDTO,
        @Extract.Permissions() permissions?: string[],
    ): Promise<[Queries.Realm.Entity[], number]> {
        return this.realmQueries.findMany({ permissions, pagination, filters, account, view, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @RequirePermission(REALM_READ_ABSOLUTE, REALM_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a lookup list of realms" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Body() { pagination }: GetLookupListBodyDTO,
        @Query() { term }: GetLookupListQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Promise<[Queries.Realm.Entity[], number]> {
        return this.realmQueries.getLookupList({ permissions, pagination, account, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequirePermission(REALM_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Creates a new realm" })
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: CreateBodyDTO,
    ): Promise<MessageResult> {
        return this.realmCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(REALM_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Updates realm metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Query() { id }: UpdateQueryDTO,
        @Body() input: UpdateBodyDTO,
    ): Promise<MessageResult> {
        return this.realmCommands.update({ context, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @RequirePermission(REALM_REVOKE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system realm(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: RevokeBodyDTO,
    ): Promise<MessageResult> {
        return this.realmCommands.revoke({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequirePermission(REALM_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system realm(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: RestoreBodyDTO,
    ): Promise<MessageResult> {
        return this.realmCommands.restore({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @RequirePermission(REALM_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system realm(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.realmCommands.purge({ context, actor, input });
    }
}
