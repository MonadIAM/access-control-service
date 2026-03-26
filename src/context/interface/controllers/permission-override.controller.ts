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
import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_OVERRIDE_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetPermissionOverridesListQueryDTO,
    GetPermissionOverridesListBodyDTO,
    GetPermissionOverrideByIdQueryDTO,
    RestorePermissionOverrideQueryDTO,
    RestorePermissionOverrideBodyDTO,
    RevokePermissionOverrideQueryDTO,
    CreatePermissionOverrideQueryDTO,
    RevokePermissionOverrideBodyDTO,
    CreatePermissionOverrideBodyDTO,
    PurgePermissionOverrideQueryDTO,
    PurgePermissionOverrideBodyDTO,
    PermissionOverrideListDTO,
    PermissionOverrideDTO,
} from "../dto/permission-override";

@ApiTags("PermissionOverride")
@Controller("/permission-override")
@UseInterceptors(MonitoringInterceptor)
export class PermissionOverrideController {
    private readonly populate = {
        DETAILED: ["permission", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
        @Inject(PERMISSION_OVERRIDE_OPERATION)
        private readonly permissionOverrideOperation: Operations.PermissionOverride.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionOverrideDTO)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_READ)
    @ApiOperation({ summary: "Returns a permission override by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { override, realm, view }: GetPermissionOverrideByIdQueryDTO,
    ): Promise<Repositories.PermissionOverride.Entity> {
        return this.permissionOverrideRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: override, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionOverrideListDTO)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_READ)
    @ApiOperation({ summary: "Returns a paginated list of permission overrides" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetPermissionOverridesListQueryDTO,
        @Body() { pagination, filters, sort }: GetPermissionOverridesListBodyDTO,
    ): Promise<[Repositories.PermissionOverride.Entity[], number]> {
        return this.permissionOverrideRepository.findMany({
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
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_CREATE)
    @ApiOperation({ summary: "Creates a new permission override" })
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
        @Query() { realm }: CreatePermissionOverrideQueryDTO,
        @Body() input: CreatePermissionOverrideBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOverrideOperation.create({ actor, context, input, realm });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionOverrideQueryDTO,
        @Body() input: RevokePermissionOverrideBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOverrideOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_RESTORE)
    @ApiOperation({ summary: "Restores a non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionOverrideQueryDTO,
        @Body() input: RestorePermissionOverrideBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOverrideOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionOverrideQueryDTO,
        @Body() input: PurgePermissionOverrideBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOverrideOperation.purge({ actor, context, input, realm });
    }
}
