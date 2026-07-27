import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { INVITE_COMMANDS } from "../commands";
import { INVITE_QUERIES } from "../queries";
import {
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

const { INVITE_READ_PERSONAL, INVITE_CHANGE_STATUS, INVITE_CREATE } = PermissionCode;
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
    @RequirePermission(INVITE_READ_PERSONAL)
    @ApiResponse({ status: OK, type: InviteDTO })
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
    public getById(
        @Query() { invite, realm, view, mode }: GetByIdQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Invite.FindUnique.Result {
        return this.inviteQueries.findUnique({ mode, invite, realm, actor, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @RequirePermission(INVITE_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of invites for the current account (sent or received)",
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
    public getPersonalList(
        @Body() { pagination, filters, sort, scope }: GetListBodyDTO,
        @Query() { realm, view, mode }: GetListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Invite.FindMany.Result {
        return this.inviteQueries.findMany({ mode, pagination, filters, sort, realm, view, actor, scope });
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

    @HttpCode(OK)
    @Patch("change-status")
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
