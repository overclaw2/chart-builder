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
 * HTTP Interceptor to add keep-alive headers to all requests
 * This helps prevent gateway timeout by maintaining active connection
 */
@Injectable()
export class KeepAliveInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add keep-alive headers to every request
    let modifiedReq = req.clone({
      setHeaders: {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=300, max=100', // 5 minute timeout, up to 100 requests
      },
      // Ensure we don't timeout on long-running requests
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
