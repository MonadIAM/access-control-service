import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger } from "~common/decorators";
import { PERMISSION_OVERRIDE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetByIdQueryDTO,
    ManageGetListQueryDTO,
    PermissionOverrideDTO,
    GetListBodyDTO,
    ListDTO,
} from "../dto/permission-override";

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
const { PERMISSION_OVERRIDE_READ_ABSOLUTE } = PermissionCode;

@ApiTags("PermissionOverride")
@Controller("/permission-override/manage")
@UseInterceptors(MonitoringInterceptor)
export class PermissionOverrideManageController {
    public constructor(
        @Inject(PERMISSION_OVERRIDE_QUERIES)
        private readonly permissionOverrideQueries: Queries.PermissionOverride.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionOverrideDTO)
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: PermissionOverrideDTO })
    @ApiOperation({
        summary: "Returns a permission override by identifier",
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
        @Query() { override, realm, view, mode }: ManageGetByIdQueryDTO,
    ): Queries.PermissionOverride.FindUnique.Result {
        return this.permissionOverrideQueries.findUnique({ mode, override, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of permission overrides across all realms",
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
        @Query() { realm, view, mode }: ManageGetListQueryDTO,
    ): Queries.PermissionOverride.FindMany.Result {
        return this.permissionOverrideQueries.findMany({ mode, pagination, filters, realm, sort, view });
    }
}
