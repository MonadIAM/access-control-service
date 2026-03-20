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
import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_ROLE_ASSIGNMENT_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetAccountRoleAssignmentsListQueryDTO,
    GetAccountRoleAssignmentsListBodyDTO,
    GetAccountRoleAssignmentByIdQueryDTO,
    RestoreAccountRoleAssignmentQueryDTO,
    RestoreAccountRoleAssignmentBodyDTO,
    RevokeAccountRoleAssignmentQueryDTO,
    RevokeAccountRoleAssignmentBodyDTO,
    CreateAccountRoleAssignmentQueryDTO,
    CreateAccountRoleAssignmentBodyDTO,
    PurgeAccountRoleAssignmentQueryDTO,
    PurgeAccountRoleAssignmentBodyDTO,
    AccountRoleAssignmentListDTO,
    AccountRoleAssignmentDTO,
} from "../dto/account-role-assignment";

@ApiTags("AccountRoleAssignment")
@Controller("/account-role-assignment")
@UseInterceptors(MonitoringInterceptor)
export class AccountRoleAssignmentController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_OPERATION)
        private readonly accountRoleAssignmentOperation: Operations.AccountRoleAssignment.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a account role assignment by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleAssignmentDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { assignment, realm, view }: GetAccountRoleAssignmentByIdQueryDTO,
    ): Promise<AccountRoleAssignmentDTO> {
        return this.accountRoleAssignmentRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: assignment, realm } })
            .then((data) => super.formatResponse({ DTO: AccountRoleAssignmentDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a paginated list of account role assignments" })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleAssignmentListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetAccountRoleAssignmentsListQueryDTO,
        @Body() { pagination, filters, sort }: GetAccountRoleAssignmentsListBodyDTO,
    ): Promise<AccountRoleAssignmentListDTO> {
        return this.accountRoleAssignmentRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: AccountRoleAssignmentListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_CREATE)
    @ApiOperation({ summary: "Creates a new account role assignment" })
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
        @Query() { realm }: CreateAccountRoleAssignmentQueryDTO,
        @Body() input: CreateAccountRoleAssignmentBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentOperation
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system account role assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeAccountRoleAssignmentQueryDTO,
        @Body() input: RevokeAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentOperation
            .revoke({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_RESTORE)
    @ApiOperation({ summary: "Restores a non-system account role assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreAccountRoleAssignmentQueryDTO,
        @Body() input: RestoreAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentOperation
            .restore({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system account role assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeAccountRoleAssignmentQueryDTO,
        @Body() input: PurgeAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentOperation
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
