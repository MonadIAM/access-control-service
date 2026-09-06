import { Controller, HttpStatus, HttpCode, Delete, Inject, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { ROLE_DELEGATION_POLICY_COMMANDS } from "~context/application/commands";
import { ROLE_DELEGATION_POLICY_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RoleDelegationPolicyDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    CreateQueryDTO,
    UpdateQueryDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/role-delegation-policy";

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
const {
    ROLE_DELEGATION_POLICY_READ_ABSOLUTE,
    ROLE_DELEGATION_POLICY_READ_COMMON,
    ROLE_DELEGATION_POLICY_RESTORE,
    ROLE_DELEGATION_POLICY_CREATE,
    ROLE_DELEGATION_POLICY_UPDATE,
    ROLE_DELEGATION_POLICY_REVOKE,
    ROLE_DELEGATION_POLICY_PURGE,
} = PermissionCode;

@ApiTags("RoleDelegationPolicy")
@Controller("/role-delegation-policy")
export class RoleDelegationPolicyController {
    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_COMMANDS)
        private readonly roleDelegationPolicyCommands: Commands.RoleDelegationPolicy.ControllerContract,
        @Inject(ROLE_DELEGATION_POLICY_QUERIES)
        private readonly roleDelegationPolicyQueries: Queries.RoleDelegationPolicy.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleDelegationPolicyDTO)
    @ApiResponse({ status: OK, type: RoleDelegationPolicyDTO })
    @RequirePermission(ROLE_DELEGATION_POLICY_READ_ABSOLUTE, ROLE_DELEGATION_POLICY_READ_COMMON)
    @ApiOperation({
        summary: "Returns a role delegation policy by identifier",
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
    public findUnique(@Query() { policy, realm, view }: GetByIdQueryDTO): Queries.RoleDelegationPolicy.FindUnique.Result {
        return this.roleDelegationPolicyQueries.findUnique({ policy, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_DELEGATION_POLICY_READ_ABSOLUTE, ROLE_DELEGATION_POLICY_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of role delegation policies",
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
        @Query() { realm, view }: GetListQueryDTO,
    ): Queries.RoleDelegationPolicy.FindMany.Result {
        return this.roleDelegationPolicyQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new role delegation policy",
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
        return this.roleDelegationPolicyCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_UPDATE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Updates role delegation policy data",
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
    public updateMetadata(
        @Query() { realm, id }: UpdateQueryDTO,
        @Body() input: UpdateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyCommands.update({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes one or more non-system role delegation policies",
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
    public revoke(
        @Query() { realm }: RevokeQueryDTO,
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores one or more non-system role delegation policies",
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
    public restore(
        @Query() { realm }: RestoreQueryDTO,
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes one or more revoked non-system role delegation policies",
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
    public purge(
        @Query() { realm }: PurgeQueryDTO,
        @Body() input: PurgeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyCommands.purge({ actor, context, input, realm });
    }
}
