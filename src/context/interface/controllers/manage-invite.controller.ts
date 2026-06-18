import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { INVITE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { ManageGetListQueryDTO, ManageGetListBodyDTO, ManageGetByIdQueryDTO, InviteDTO, ListDTO } from "../dto/invite";

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
const { INVITE_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Invite")
@Controller("/invite/manage")
@UseInterceptors(MonitoringInterceptor)
export class InviteManageController {
    public constructor(
        @Inject(INVITE_QUERIES)
        private readonly inviteQueries: Queries.Invite.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(InviteDTO)
    @ApiResponse({ status: OK, type: InviteDTO })
    @RequireGlobalPermission(INVITE_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns an invite by identifier",
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
    public findUnique(@Query() { invite, realm, view, mode }: ManageGetByIdQueryDTO): Queries.Invite.FindUnique.Result {
        return this.inviteQueries.findUnique({ mode, invite, realm, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(INVITE_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of all invites",
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
    ): Queries.Invite.FindMany.Result {
        return this.inviteQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
