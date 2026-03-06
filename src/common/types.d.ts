import type { FastifyRequest, RouteGenericInterface } from "fastify";

declare global {
    type Pagination = {
        currentPage: number;
        elementsPerPage: number;
    };

    type RequestContext = {
        userAgent: string;
        ip: string;
    };

    type MessageResult = {
        message: string;
        params?: Record<string, unknown>;
    };

    type Req<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
        actorContext: ActorContext;
    };

    type ActorContext = {
        account: string;
    };
}
