import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
    public constructor(
        @InjectMetric("http_request_duration_seconds") private readonly histogram: Histogram,
        @InjectMetric("http_requests_total") private readonly counter: Counter,
    ) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();

        const { method, url } = request;
        const path = request.route?.path ?? url;
        const start = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = (Date.now() - start) / 1000;
                const status = response.statusCode;

                this.recordMetrics(method, path, status, duration);
            }),
            catchError((err) => {
                const duration = (Date.now() - start) / 1000;
                const status = err.status ?? err.statusCode ?? 500;

                this.recordMetrics(method, path, status, duration);

                return throwError(() => err);
            }),
        );
    }

    private recordMetrics(method: string, route: string, status: number, duration: number): void {
        const labels = { method, route, status };
        this.counter.inc(labels);
        this.histogram.observe(labels, duration);
    }
}
