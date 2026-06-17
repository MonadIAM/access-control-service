import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { ROLE_QUERIES } from "~context/application/queries";
import { PermissionCode } from "~context/enums";

import {
    ManageGetDelegableByAccountListQueryDTO,
    ManageGetDelegableByAccountListBodyDTO,
    ManageGetEffectiveListQueryDTO,
    ManageGetEffectiveListBodyDTO,
    ManageGetListQueryDTO,
    ManageGetListBodyDTO,
    ListDTO,
} from "../dto/role";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN, OK } =
    HttpStatus;
const { ROLE_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Role")
@Controller("/role/manage")
@UseInterceptors(MonitoringInterceptor)
export class RoleManageController {
    public constructor(
        @Inject(ROLE_QUERIES)
        private readonly roleQueries: Queries.Role.Contract,
    ) {}

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @RequireGlobalPermission(ROLE_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of roles across realms",
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
    ): Queries.Role.FindMany.Result {
        return this.roleQueries.findMany({ mode, pagination, filters, sort, view });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @RequireGlobalPermission(ROLE_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of effective roles for the specified account",
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
        @Query() { account, mode }: ManageGetEffectiveListQueryDTO,
    ): Queries.Role.FindEffective.Result {
        return this.roleQueries.findEffective({ mode, pagination, filters, sort, account });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("list/delegable/by-account")
    @RequireGlobalPermission(ROLE_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of roles that can be delegated by the specified account",
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
    public findDelegableByAccount(
        @Body() { pagination, filters, sort }: ManageGetDelegableByAccountListBodyDTO,
        @Query() { account, mode }: ManageGetDelegableByAccountListQueryDTO,
    ): Queries.Role.FindDelegableByAccount.Result {
        return this.roleQueries.findDelegableByAccount({ mode, pagination, filters, sort, account });
    }
}
