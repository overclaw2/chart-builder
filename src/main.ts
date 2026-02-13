import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { KeepAliveInterceptor } from './app/core/services/keep-alive.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeepAliveInterceptor,
      multi: true,
    },
  ],
}).catch((err: any) => console.error(err));
