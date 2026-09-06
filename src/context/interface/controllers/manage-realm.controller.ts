import { Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { REALM_QUERIES } from "~context/application/queries";
import { PermissionCode } from "~context/enums";

import {
    ManageGetLookupListQueryDTO,
    ManageGetListQueryDTO,
    ManageGetListBodyDTO,
    ManageGetByIdQueryDTO,
    GetLookupListBodyDTO,
    LookupListDTO,
    RealmDTO,
    ListDTO,
} from "../dto/realm";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    OK,
} = HttpStatus;
const { REALM_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Realm")
@Controller("/realm/manage")
export class RealmManageController {
    public constructor(
        @Inject(REALM_QUERIES)
        private readonly realmQueries: Queries.Realm.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RealmDTO)
    @ApiResponse({ status: OK, type: RealmDTO })
    @RequireGlobalPermission(REALM_READ_ABSOLUTE)
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
    public findUnique(@Query() { realm, view, mode }: ManageGetByIdQueryDTO): Queries.Realm.FindUnique.Result {
        return this.realmQueries.findUnique({ mode, realm, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(REALM_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of realms across all realms",
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
        @Body() { pagination, filters, sort }: ManageGetListBodyDTO,
        @Query() { view, mode }: ManageGetListQueryDTO,
    ): Queries.Realm.FindMany.Result {
        return this.realmQueries.findMany({ mode, pagination, filters, view, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @RequireGlobalPermission(REALM_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a lookup list of all realms",
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
        @Query() { term, mode }: ManageGetLookupListQueryDTO,
    ): Queries.Realm.GetLookupList.Result {
        return this.realmQueries.getLookupList({ mode, pagination, term });
    }
}
