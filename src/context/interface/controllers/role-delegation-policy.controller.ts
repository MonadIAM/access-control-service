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
import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_OPERATION } from "~context/application/operations";
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

@ApiTags("RoleDelegationPolicy")
@Controller("/role-delegation-policy")
@UseInterceptors(MonitoringInterceptor)
export class RoleDelegationPolicyController {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_DELEGATION_POLICY_OPERATION)
        private readonly roleDelegationPolicyOperation: Operations.RoleDelegationPolicy.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleDelegationPolicyDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_READ_ALL)
    @ApiOperation({ summary: "Returns a role delegation policy by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { policy, realm, view }: GetRoleDelegationPolicyByIdQueryDTO,
    ): Promise<Repositories.RoleDelegationPolicy.Entity> {
        return this.roleDelegationPolicyRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: policy, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleDelegationPolicyListDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_READ_ALL)
    @ApiOperation({ summary: "Returns a paginated list of role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRoleDelegationPoliciesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleDelegationPoliciesListBodyDTO,
    ): Promise<[Repositories.RoleDelegationPolicy.Entity[], number]> {
        return this.roleDelegationPolicyRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            realm,
            sort,
        });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_CREATE)
    @ApiOperation({ summary: "Creates a new role delegation policy" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleDelegationPolicyQueryDTO,
        @Body() input: CreateRoleDelegationPolicyBodyDTO,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.create({ actor, context, input, realm });
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_UPDATE)
    @ApiOperation({ summary: "Updates role delegation policy data" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleDelegationPolicyQueryDTO,
        @Body() input: UpdateRoleDelegationPolicyBodyDTO,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.update({ actor, context, input, realm, id });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleDelegationPolicyQueryDTO,
        @Body() input: RevokeRoleDelegationPolicyBodyDTO,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleDelegationPolicyQueryDTO,
        @Body() input: RestoreRoleDelegationPolicyBodyDTO,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleDelegationPolicyQueryDTO,
        @Body() input: PurgeRoleDelegationPolicyBodyDTO,
    ): Promise<MessageResult> {
        return this.roleDelegationPolicyOperation.purge({ actor, context, input, realm });
    }
}
