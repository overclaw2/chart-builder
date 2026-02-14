import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * HTTP Interceptor for request configuration
 * Note: Browser forbids setting 'Connection' and 'Keep-Alive' headers for security
 * Browsers handle keep-alive automatically via HTTP/1.1 persistent connections
 */
@Injectable()
export class KeepAliveInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Note: 'Connection' and 'Keep-Alive' are forbidden headers in browsers
    // Browsers handle keep-alive automatically and don't allow JavaScript to set these headers
    // We keep withCredentials for credential handling
    let modifiedReq = req.clone({
      withCredentials: true,
    });

    // Log request timing for diagnostics
    const requestStartTime = Date.now();

    return next.handle(modifiedReq).pipe(
      tap(
        (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - requestStartTime;
            console.debug(`Request to ${modifiedReq.url} completed in ${duration}ms`);
          }
        },
        (error) => {
          const duration = Date.now() - requestStartTime;
          console.error(`Request to ${modifiedReq.url} failed after ${duration}ms:`, error);
        }
      )
    );
  }
}
