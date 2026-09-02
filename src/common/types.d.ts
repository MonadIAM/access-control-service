import type { FastifyRequest, RouteGenericInterface } from "fastify";

declare global {
    type Pagination = {
        currentPage: number;
        elementsPerPage: number;
    };

    type MessageResult = {
        message: Intl.Key;
        params?: Record<string, unknown>;
    };

    type Req<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
        session: Extract.Session.Public | Extract.Session.Auth;
        metadata: {
            permissions?: string[];
        };
    };
}
