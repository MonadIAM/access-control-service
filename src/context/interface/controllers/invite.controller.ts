import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { INVITE_COMMANDS } from "~context/application/commands";
import { INVITE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    GetListAbsoluteBodyDTO,
    ChangeStatusQueryDTO,
    ChangeStatusBodyDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    CreateQueryDTO,
    GetListBodyDTO,
    CreateBodyDTO,
    InviteDTO,
    ListDTO,
} from "../dto/invite";

const { INVITE_READ_PERSONAL, INVITE_READ_ABSOLUTE, INVITE_CHANGE_STATUS, INVITE_CREATE } = PermissionCode;
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

@ApiTags("Invite")
@Controller("/invite")
@UseInterceptors(MonitoringInterceptor)
export class InviteController {
    public constructor(
        @Inject(INVITE_COMMANDS)
        private readonly inviteCommands: Commands.Invite.ControllerContract,
        @Inject(INVITE_QUERIES)
        private readonly inviteQueries: Queries.Invite.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(InviteDTO)
    @ApiResponse({ status: OK, type: InviteDTO })
    @ApiOperation({
        summary: "Returns an invite by identifier",
        security: [{ identity: [] }],
    })
    @RequirePermission(INVITE_READ_PERSONAL, INVITE_READ_ABSOLUTE)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public getById(
        @Query() { invite, realm, view }: GetByIdQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions: string[],
    ): Queries.Invite.FindUnique.Result {
        return this.inviteQueries.findUnique({ permissions, invite, realm, actor, view });
    }

    @HttpCode(OK)
    @Post("list/personal")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of invites for the current account (sent or received)",
        security: [{ identity: [] }],
    })
    @RequirePermission(INVITE_READ_PERSONAL)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public getPersonalList(
        @Body() { pagination, filters, sort, scope }: GetListBodyDTO,
        @Query() { realm, view }: GetListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Invite.FindMany.Result {
        return this.inviteQueries.findMany({ pagination, filters, sort, realm, view, actor, scope });
    }

    @HttpCode(OK)
    @Post("list/absolute")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of all invites",
        security: [{ identity: [] }],
    })
    @RequirePermission(INVITE_READ_ABSOLUTE)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public getList(
        @Body() { pagination, filters, sort }: GetListAbsoluteBodyDTO,
        @Query() { view }: BaseReadQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Invite.FindMany.Result {
        return this.inviteQueries.findMany({ pagination, filters, actor, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INVITE_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Sends an invite to an account for a role within a realm",
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
        CONFLICT,
    )
    public create(
        @Query() { realm }: CreateQueryDTO,
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.inviteCommands.create({ context, realm, actor, input });
    }

    @Patch("change-status")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INVITE_CHANGE_STATUS)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Changes the status of a pending invite (cancel / accept / decline)",
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
    public changeStatus(
        @Query() { realm }: ChangeStatusQueryDTO,
        @Body() input: ChangeStatusBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.inviteCommands.changeStatus({ context, realm, actor, input });
    }
}
