import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, Subject } from 'rxjs';
import { catchError, debounceTime, takeUntil, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GatewayHealthService {
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 second timeout
  private readonly RESTART_THRESHOLD = 120000; // 2 minutes of failed checks triggers restart
  private readonly MAX_CONSECUTIVE_FAILURES = 4; // Threshold for restart

  private isHealthy = new BehaviorSubject<boolean>(true);
  public isHealthy$ = this.isHealthy.asObservable();

  private failureCount = 0;
  private lastHealthCheckTime = Date.now();
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.startHealthMonitoring();
  }

  private startHealthMonitoring(): void {
    // Start periodic health checks every 30 seconds
    interval(this.HEALTH_CHECK_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000) // Debounce to prevent excessive checks
      )
      .subscribe(() => {
        this.performHealthCheck();
      });

    // Perform initial health check
    this.performHealthCheck();
  }

  private performHealthCheck(): void {
    const checkStartTime = Date.now();
    
    // Create a timeout promise for the health check
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, this.HEALTH_CHECK_TIMEOUT);
    });

    // Simple health check - ping an endpoint
    const healthCheckRequest = this.http.get('/api/health')
      .pipe(
        tap(() => {
          const checkDuration = Date.now() - checkStartTime;
          this.handleHealthCheckSuccess(checkDuration);
        }),
        catchError((error) => {
          this.handleHealthCheckFailure();
          return of(null);
        })
      )
      .toPromise()
      .then((result) => {
        // If we get a result, clear the timeout
        return result;
      })
      .catch((error) => {
        // Already handled in catchError
        return null;
      });

    // Set a timeout for the health check request
    Promise.race([healthCheckRequest, timeoutPromise]).then(() => {
      // Request completed or timed out
    });
  }

  private handleHealthCheckSuccess(duration: number): void {
    this.failureCount = 0;
    this.lastHealthCheckTime = Date.now();
    
    if (!this.isHealthy.value) {
      this.isHealthy.next(true);
      console.log('Gateway health restored');
    }

    // Log successful health check
    console.log(`Gateway health check passed (${duration}ms)`);
  }

  private handleHealthCheckFailure(): void {
    this.failureCount++;
    console.warn(`Gateway health check failed (${this.failureCount}/${this.MAX_CONSECUTIVE_FAILURES})`);

    if (this.failureCount === 1) {
      this.isHealthy.next(false);
      console.warn('Gateway appears to be unhealthy');
    }

    // Trigger restart if we hit the failure threshold
    if (this.failureCount >= this.MAX_CONSECUTIVE_FAILURES) {
      this.triggerGatewayRestart();
    }
  }

  private triggerGatewayRestart(): void {
    console.error('Gateway health check failed too many times. Attempting restart...');

    // Send restart command to the gateway
    this.http.post('/api/gateway/restart', {})
      .pipe(
        tap(() => {
          console.log('Gateway restart command sent');
          this.failureCount = 0;
          this.isHealthy.next(true);
        }),
        catchError((error) => {
          console.error('Failed to restart gateway:', error);
          // If restart fails, try page reload as last resort
          this.performPageReload();
          return of(null);
        })
      )
      .subscribe();
  }

  private performPageReload(): void {
    console.warn('Performing page reload due to persistent gateway issues');
    // Wait a moment before reloading to ensure user sees the message
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  /**
   * Manual health check trigger - for diagnostic purposes
   */
  public checkHealth(): Observable<boolean> {
    return this.http.get<any>('/api/health')
      .pipe(
        tap(() => {
          console.log('Manual health check: Gateway is healthy');
        }),
        catchError((error) => {
          console.error('Manual health check failed:', error);
          return of(false);
        })
      );
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): Observable<boolean> {
    return this.isHealthy$;
  }

  /**
   * Reset failure count (useful after manual restart)
   */
  public resetFailureCount(): void {
    this.failureCount = 0;
    this.isHealthy.next(true);
    console.log('Gateway failure count reset');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
