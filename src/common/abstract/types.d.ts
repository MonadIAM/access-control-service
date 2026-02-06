declare namespace BaseController {
    type FormatServiceResponse<T> = {
        pagination?: Pagination;
        lang?: string;
        DTO: Class<T>;
        data: unknown;
    };
}
