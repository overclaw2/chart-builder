import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { KeepAliveInterceptor } from './app/core/services/keep-alive.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeepAliveInterceptor,
      multi: true,
    },
  ],
}).catch((err: any) => console.error(err));
