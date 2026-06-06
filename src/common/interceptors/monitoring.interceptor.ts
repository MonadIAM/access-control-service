import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";
import { catchError, tap } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { FastifyRequest } from "fastify";
import { Reflector } from "@nestjs/core";

import { SKIP_INTERCEPTORS } from "~common/decorators";
import { Exception } from "~common/exceptions";

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
    public constructor(
        @InjectMetric("http_request_duration_seconds")
        private readonly histogram: Histogram<string>,
        @InjectMetric("http_requests_total")
        private readonly counter: Counter<string>,
        private readonly reflector: Reflector,
    ) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_INTERCEPTORS, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skip) {
            return next.handle();
        }

        const start = Date.now();

        return next.handle().pipe(
            tap(() => this.collect(context, start)),
            catchError((err) => {
                this.collect(context, start, err);
                return throwError(() => err);
            }),
        );
    }

    private collect(context: ExecutionContext, start: number, error?: unknown): void {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const response = context.switchToHttp().getResponse();

        const duration = (Date.now() - start) / 1e3;
        const { method } = request;

        const route = request.routeOptions?.url ?? request.raw?.url ?? "unmapped";

        const status = error ? this.resolveErrorStatus(error) : response.statusCode;

        this.recordMetrics(method, route, status, duration);
    }

    private recordMetrics(method: string, route: string, status: number, duration: number): void {
        const labels = { method, route, status };
        this.counter.inc(labels);
        this.histogram.observe(labels, duration);
    }

    private resolveErrorStatus(error: unknown): number {
        if (error instanceof Exception) {
            return error.statusCode;
        }
        if (error instanceof HttpException) {
            return error.getStatus();
        }
        return 500;
    }
}
