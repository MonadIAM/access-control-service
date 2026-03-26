type FormatResponse<T> = {
    pagination?: Pagination;
    lang?: string;
    DTO: Class<T>;
    data: unknown;
};
