import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { AccountRoleMatrixRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetAccountRoleMatricesListQueryDTO,
    GetAccountRoleMatricesListBodyDTO,
    GetAccountRoleMatrixByIdQueryDTO,
    AccountRoleMatrixListDTO,
    AccountRoleMatrixDTO,
} from "../dto/account-role-matrix";

@ApiTags("AccountRoleMatrix")
@Controller("/account-role-matrix")
export class AccountRoleMatrixController extends BaseController {
    public constructor(
        private readonly accountRoleMatrixRepository: AccountRoleMatrixRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a account-role-matrix by identifier" })
    @ApiQuery({ type: GetAccountRoleMatrixByIdQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleMatrixDTO })
    public getById(@Query() { matrix, realm }: GetAccountRoleMatrixByIdQueryDTO): Promise<AccountRoleMatrixDTO> {
        return this.accountRoleMatrixRepository
            .findUniqueOrThrow({ options: { populate: ["realm", "role"] }, where: { id: matrix, realm } })
            .then((data) => super.formatResponse({ DTO: AccountRoleMatrixDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of account-role-matrices" })
    @ApiBody({ type: GetAccountRoleMatricesListBodyDTO, required: true })
    @ApiQuery({ type: GetAccountRoleMatricesListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleMatrixListDTO })
    public getList(
        @Query() { realm }: GetAccountRoleMatricesListQueryDTO,
        @Body() { pagination, filters, sort }: GetAccountRoleMatricesListBodyDTO,
    ): Promise<AccountRoleMatrixListDTO> {
        return this.accountRoleMatrixRepository
            .findMany({ options: { populate: ["realm", "role"] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: AccountRoleMatrixListDTO, pagination, data }));
    }
}
