import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";
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

import { EndpointExceptions, ExtractActor, ExtractContext, RequirePermission } from "~common/decorators";
import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
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
export class RoleDelegationPolicyController extends BaseController {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_DELEGATION_POLICY_HANDLER)
        private readonly roleDelegationPolicyHandler: Handlers.RoleDelegationPolicy.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_READ)
    @ApiOperation({ summary: "Returns a role delegation policy by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { policy, realm, view }: GetRoleDelegationPolicyByIdQueryDTO,
    ): Promise<RoleDelegationPolicyDTO> {
        return this.roleDelegationPolicyRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: policy, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_READ)
    @ApiOperation({ summary: "Returns a paginated list of role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRoleDelegationPoliciesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleDelegationPoliciesListBodyDTO,
    ): Promise<RoleDelegationPolicyListDTO> {
        return this.roleDelegationPolicyRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
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
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_UPDATE)
    @ApiOperation({ summary: "Updates role delegation policy data" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleDelegationPolicyQueryDTO,
        @Body() input: UpdateRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .update({ actor, context, input, realm, id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleDelegationPolicyQueryDTO,
        @Body() input: RevokeRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .revoke({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleDelegationPolicyQueryDTO,
        @Body() input: RestoreRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .restore({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_DELEGATION_POLICY_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleDelegationPolicyQueryDTO,
        @Body() input: PurgeRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
