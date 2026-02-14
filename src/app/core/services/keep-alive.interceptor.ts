import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

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

    // Pass through without verbose logging to avoid console spam
    return next.handle(modifiedReq);
  }
}
