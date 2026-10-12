import { Controller, HttpStatus, HttpCode, Delete, Inject, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import {
    RequireGlobalPermission,
    RequirePermission,
    FormatResponse,
    Swagger,
    Extract,
    Reauthentication,
} from "~common/decorators";
import { PermissionCode, PrivilegeScope } from "~context/enums";
import { REALM_COMMANDS } from "~context/application/commands";
import { REALM_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";

import {
    GetLookupListQueryDTO,
    GetLookupListBodyDTO,
    GetByIdQueryDTO,
    GetListQueryDTO,
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

const { REALM_READ_PERSONAL, REALM_RESTORE, REALM_CREATE, REALM_UPDATE, REALM_REVOKE, REALM_PURGE } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
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
export class RealmController {
    public constructor(
        @Inject(REALM_COMMANDS)
        private readonly realmCommands: Commands.Realm.ControllerContract,
        @Inject(REALM_QUERIES)
        private readonly realmQueries: Queries.Realm.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RealmDTO)
    @RequirePermission(REALM_READ_PERSONAL)
    @ApiResponse({ status: OK, type: RealmDTO })
    @ApiOperation({
        summary: "Returns a realm by identifier",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public findUnique(
        @Query() { realm, view, mode }: GetByIdQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
    ): Queries.Realm.FindUnique.Result {
        return this.realmQueries.findUnique({ mode, account, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(REALM_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of realms",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { view, mode }: GetListQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
    ): Queries.Realm.FindMany.Result {
        return this.realmQueries.findMany({ mode, pagination, filters, account, view, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @RequirePermission(REALM_READ_PERSONAL)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @ApiOperation({
        summary: "Returns a lookup list of realms",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public getLookupList(
        @Body() { pagination }: GetLookupListBodyDTO,
        @Query() { term, mode }: GetLookupListQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
    ): Queries.Realm.GetLookupList.Result {
        return this.realmQueries.getLookupList({ mode, pagination, account, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequireGlobalPermission(REALM_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new realm",
        description: "Platform administrator operation for manual realm reconciliation; requires a global permission.",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.realmCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(REALM_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Updates realm metadata",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public updateMetadata(
        @Query() { id }: UpdateQueryDTO,
        @Body() input: UpdateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.realmCommands.update({ context, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @RequireGlobalPermission(REALM_REVOKE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes a non-system realm(s)",
        description: "Platform administrator operation for manual realm reconciliation; requires a global permission.",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public revoke(
        @Body() input: RevokeBodyDTO,
        @Extract.Permissions(PrivilegeScope.GLOBAL) permissions: string[],
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.realmCommands.revoke({ context, actor, input, global: permissions.length > 0 });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequireGlobalPermission(REALM_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores a non-system realm(s)",
        description: "Platform administrator operation for manual realm reconciliation; requires a global permission.",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public restore(
        @Body() input: RestoreBodyDTO,
        @Extract.Permissions(PrivilegeScope.GLOBAL) permissions: string[],
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.realmCommands.restore({ context, actor, input, global: permissions.length > 0 });
    }

    @HttpCode(OK)
    @Delete("purge")
    @Reauthentication()
    @RequireGlobalPermission(REALM_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system realm(s)",
        description: "Platform administrator operation for manual realm reconciliation; requires a global permission.",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public purge(
        @Body() input: PurgeBodyDTO,
        @Extract.Permissions(PrivilegeScope.GLOBAL) permissions: string[],
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.realmCommands.purge({ context, actor, input, global: permissions.length > 0 });
    }
}
