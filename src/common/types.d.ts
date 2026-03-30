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
        params?: UnknownObject;
    };

    type Req<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
        metadata: Record<string, unknown>;
        actorContext: ActorContext;
    };

    type ActorContext = {
        account: string;
    };
}
