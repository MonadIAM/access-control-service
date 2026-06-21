import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { PERMISSION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetEffectiveListQueryDTO,
    ManageGetEffectiveListBodyDTO,
    ManageGetLookupListQueryDTO,
    ManageGetListQueryDTO,
    ManageGetListBodyDTO,
    GetLookupListBodyDTO,
    LookupListDTO,
    ListDTO,
} from "../dto/permission";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN, OK } =
    HttpStatus;
const { PERMISSION_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Permission")
@Controller("/permission/manage")
@UseInterceptors(MonitoringInterceptor)
export class PermissionManageController {
    public constructor(
        @Inject(PERMISSION_QUERIES)
        private readonly permissionQueries: Queries.Permission.Contract,
    ) {}

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(PERMISSION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of permissions across realms",
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
        @Query() { view, mode }: ManageGetListQueryDTO,
        @Body() { pagination, filters, sort }: ManageGetListBodyDTO,
    ): Queries.Permission.FindMany.Result {
        return this.permissionQueries.findMany({ mode, pagination, filters, sort, view });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(PERMISSION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of effective permissions for the specified account",
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
    public findEffective(
        @Body() { pagination, filters, sort }: ManageGetEffectiveListBodyDTO,
        @Query() { realm, account, mode }: ManageGetEffectiveListQueryDTO,
    ): Queries.Permission.FindEffective.Result {
        return this.permissionQueries.findEffective({ mode, pagination, filters, sort, realm, account });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @RequireGlobalPermission(PERMISSION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a lookup list of permissions across realms",
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
        @Query() { term, mode }: ManageGetLookupListQueryDTO,
        @Body() { pagination }: GetLookupListBodyDTO,
    ): Queries.Permission.GetLookupList.Result {
        return this.permissionQueries.getLookupList({ mode, pagination, term });
    }
}
