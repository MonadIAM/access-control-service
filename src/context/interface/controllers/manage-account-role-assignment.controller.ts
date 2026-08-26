import { Body, Controller, HttpStatus, Post, HttpCode, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { ACCOUNT_ROLE_ASSIGNMENT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { ManageGetListBodyDTO, ManageGetListQueryDTO, ListDTO } from "../dto/account-role-assignment";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN, OK } =
    HttpStatus;
const { ACCOUNT_ROLE_ASSIGNMENT_READ_ABSOLUTE } = PermissionCode;

@ApiTags("AccountRoleAssignment")
@Controller("/account-role-assignment/manage")
@UseInterceptors(MonitoringInterceptor)
export class AccountRoleAssignmentManageController {
    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_QUERIES)
        private readonly accountRoleAssignmentQueries: Queries.AccountRoleAssignment.ControllerContract,
    ) {}

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(ACCOUNT_ROLE_ASSIGNMENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of account role assignments across all realms",
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
    ): Queries.AccountRoleAssignment.FindMany.Result {
        return this.accountRoleAssignmentQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
