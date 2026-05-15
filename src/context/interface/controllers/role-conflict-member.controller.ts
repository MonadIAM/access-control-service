import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { ROLE_CONFLICT_MEMBER_COMMANDS } from "~context/application/commands";
import { ROLE_CONFLICT_MEMBER_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RoleConflictMemberDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    GetListBodyDTO,
    CreateQueryDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/role-conflict-member";

const { ROLE_CONFLICT_MEMBER_READ_ABSOLUTE, ROLE_CONFLICT_MEMBER_CREATE, ROLE_CONFLICT_MEMBER_PURGE } = PermissionCode;
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

@ApiTags("RoleConflictMember")
@Controller("/role-conflict-member")
@UseInterceptors(MonitoringInterceptor)
export class RoleConflictMemberController {
    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_COMMANDS)
        private readonly roleConflictMemberCommands: Commands.RoleConflictMember.ControllerContract,
        @Inject(ROLE_CONFLICT_MEMBER_QUERIES)
        private readonly roleConflictMemberQueries: Queries.RoleConflictMember.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleConflictMemberDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: RoleConflictMemberDTO })
    @ApiOperation({ summary: "Returns a role conflict member by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { member, group, realm, view }: GetByIdQueryDTO,
    ): Promise<Queries.RoleConflictMember.Entity> {
        return this.roleConflictMemberQueries.findUnique({ member, group, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_READ_ABSOLUTE)
    @ApiOperation({ summary: "Returns a paginated list of role conflict members" })
    @ApiResponse({ status: OK, type: ListDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { group, realm, view }: GetListQueryDTO,
    ): Promise<[Queries.RoleConflictMember.Entity[], number]> {
        return this.roleConflictMemberQueries.findMany({ pagination, filters, group, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new role conflict member(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateQueryDTO,
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleConflictMemberCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict member(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Body() input: PurgeBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleConflictMemberCommands.purge({ actor, context, input, realm });
    }
}
