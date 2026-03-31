import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { ROLE_CONFLICT_MEMBER_COMMAND } from "~context/application/command";
import { ROLE_CONFLICT_MEMBER_QUERY } from "~context/application/query";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetRoleConflictMembersListQueryDTO,
    GetRoleConflictMembersListBodyDTO,
    GetRoleConflictMemberByIdQueryDTO,
    CreateRoleConflictMemberQueryDTO,
    CreateRoleConflictMemberBodyDTO,
    PurgeRoleConflictMemberQueryDTO,
    PurgeRoleConflictMemberBodyDTO,
    RoleConflictMemberListDTO,
    RoleConflictMemberDTO,
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
        @Inject(ROLE_CONFLICT_MEMBER_COMMAND)
        private readonly roleConflictMemberCommand: Commands.RoleConflictMember.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_QUERY)
        private readonly roleConflictMemberQuery: Queries.RoleConflictMember.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleConflictMemberDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: RoleConflictMemberDTO })
    @ApiOperation({ summary: "Returns a role conflict member by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { member, group, realm, view }: GetRoleConflictMemberByIdQueryDTO,
    ): Promise<Repositories.RoleConflictMember.Entity> {
        return this.roleConflictMemberQuery.findUnique({ member, group, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(RoleConflictMemberListDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_READ_ABSOLUTE)
    @ApiOperation({ summary: "Returns a paginated list of role conflict members" })
    @ApiResponse({ status: OK, type: RoleConflictMemberListDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetRoleConflictMembersListBodyDTO,
        @Query() { group, realm, view }: GetRoleConflictMembersListQueryDTO,
    ): Promise<[Repositories.RoleConflictMember.Entity[], number]> {
        return this.roleConflictMemberQuery.findMany({ pagination, filters, group, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new role conflict member(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateRoleConflictMemberQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: CreateRoleConflictMemberBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictMemberCommand.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_MEMBER_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict member(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeRoleConflictMemberQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: PurgeRoleConflictMemberBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictMemberCommand.purge({ actor, context, input, realm });
    }
}
