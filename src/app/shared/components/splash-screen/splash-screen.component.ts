import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-container" *ngIf="isVisible" [@fadeInOut]>
      <div class="splash-content">
        <h1 class="splash-title">📦 Container Ship Visualization</h1>
        <div class="splash-animation">
          <div class="container-box">
            <div class="cargo-item cargo-1"></div>
            <div class="cargo-item cargo-2"></div>
            <div class="cargo-item cargo-3"></div>
          </div>
        </div>
        <p class="splash-subtitle">Loading your cargo management dashboard...</p>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .splash-content {
      text-align: center;
      color: white;
    }

    .splash-title {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 40px 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      animation: slideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .splash-subtitle {
      font-size: 18px;
      margin: 30px 0 20px 0;
      opacity: 0.9;
      animation: fadeIn 0.8s ease-in 0.3s both;
    }

    .splash-animation {
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 30px 0;
      animation: bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .container-box {
      position: relative;
      width: 200px;
      height: 100px;
      border: 3px solid rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      backdrop-filter: blur(10px);
    }

    .cargo-item {
      height: 70%;
      border-radius: 4px;
      animation: float 2s ease-in-out infinite;
    }

    .cargo-1 {
      width: 30px;
      background: #ff6b6b;
      animation-delay: 0s;
    }

    .cargo-2 {
      width: 40px;
      background: #4ecdc4;
      animation-delay: 0.1s;
    }

    .cargo-3 {
      width: 30px;
      background: #ffe66d;
      animation-delay: 0.2s;
    }

    .progress-bar {
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin: 0 auto;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 2px;
      transition: width 0.05s linear;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SplashScreenComponent implements OnInit {
  @Input() duration: number = 3000;
  @Output() splashComplete = new EventEmitter<void>();

  isVisible = true;
  progress = 0;

  ngOnInit(): void {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.progress = Math.min((elapsed / this.duration) * 100, 100);

      if (elapsed >= this.duration) {
        clearInterval(interval);
        this.isVisible = false;
        this.splashComplete.emit();
      }
    }, 30);
  }
}
