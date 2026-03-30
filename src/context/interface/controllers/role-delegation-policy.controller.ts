import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Delete,
    Inject,
    Patch,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { ROLE_DELEGATION_POLICY_OPERATION } from "~context/application/operations";
import { ROLE_DELEGATION_POLICY_QUERY } from "~context/application/query";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetRoleDelegationPoliciesListQueryDTO,
    GetRoleDelegationPoliciesListBodyDTO,
    GetRoleDelegationPolicyByIdQueryDTO,
    RestoreRoleDelegationPolicyQueryDTO,
    RestoreRoleDelegationPolicyBodyDTO,
    RevokeRoleDelegationPolicyQueryDTO,
    CreateRoleDelegationPolicyQueryDTO,
    UpdateRoleDelegationPolicyQueryDTO,
    UpdateRoleDelegationPolicyBodyDTO,
    RevokeRoleDelegationPolicyBodyDTO,
    CreateRoleDelegationPolicyBodyDTO,
    PurgeRoleDelegationPolicyQueryDTO,
    PurgeRoleDelegationPolicyBodyDTO,
    RoleDelegationPolicyListDTO,
    RoleDelegationPolicyDTO,
} from "../dto/role-delegation-policy";

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
const {
    ROLE_DELEGATION_POLICY_READ_COMMON,
    ROLE_DELEGATION_POLICY_RESTORE,
    ROLE_DELEGATION_POLICY_CREATE,
    ROLE_DELEGATION_POLICY_UPDATE,
    ROLE_DELEGATION_POLICY_REVOKE,
    ROLE_DELEGATION_POLICY_PURGE,
} = PermissionCode;

@ApiTags("RoleDelegationPolicy")
@Controller("/role-delegation-policy")
@UseInterceptors(MonitoringInterceptor)
export class RoleDelegationPolicyController {
    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_OPERATION)
        private readonly roleDelegationPolicyOperation: Operations.RoleDelegationPolicy.Contract,
        @Inject(ROLE_DELEGATION_POLICY_QUERY)
        private readonly roleDelegationPolicyQuery: Queries.RoleDelegationPolicy.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleDelegationPolicyDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleDelegationPolicyDTO })
    @ApiOperation({ summary: "Returns a role delegation policy by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { policy, realm, view }: GetRoleDelegationPolicyByIdQueryDTO,
    ): Promise<Repositories.RoleDelegationPolicy.Entity> {
        return this.roleDelegationPolicyQuery.findUnique({ policy, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(RoleDelegationPolicyListDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_READ_COMMON)
    @ApiOperation({ summary: "Returns a paginated list of role delegation policies" })
    @ApiResponse({ status: OK, type: RoleDelegationPolicyListDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetRoleDelegationPoliciesListBodyDTO,
        @Query() { realm, view }: GetRoleDelegationPoliciesListQueryDTO,
    ): Promise<[Repositories.RoleDelegationPolicy.Entity[], number]> {
        return this.roleDelegationPolicyQuery.findMany({ pagination, filters, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new role delegation policy" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateRoleDelegationPolicyQueryDTO,
        @Body() input: CreateRoleDelegationPolicyBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_UPDATE)
    @ApiOperation({ summary: "Updates role delegation policy data" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @Query() { realm, id }: UpdateRoleDelegationPolicyQueryDTO,
        @Body() input: UpdateRoleDelegationPolicyBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.update({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes one or more non-system role delegation policies" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeRoleDelegationPolicyQueryDTO,
        @Body() input: RevokeRoleDelegationPolicyBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores one or more non-system role delegation policies" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreRoleDelegationPolicyQueryDTO,
        @Body() input: RestoreRoleDelegationPolicyBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_DELEGATION_POLICY_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Permanently deletes one or more revoked non-system role delegation policies" })
    public purge(
        @Query() { realm }: PurgeRoleDelegationPolicyQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: PurgeRoleDelegationPolicyBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.purge({ actor, context, input, realm });
    }
}
