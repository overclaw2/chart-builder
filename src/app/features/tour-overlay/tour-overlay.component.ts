import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpService, TourStep } from '../../core/services/help.service';

@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour-overlay.component.html',
  styleUrls: ['./tour-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourOverlayComponent implements OnInit {
  isTourActive: boolean = false;
  currentStep: number = 0;
  currentTourStep: TourStep | null = null;
  totalSteps: number = 0;
  highlightBox: { top: number; left: number; width: number; height: number; padding: number } | null = null;

  constructor(private helpService: HelpService) {}

  ngOnInit(): void {
    this.helpService.tourActive$.subscribe((active) => {
      this.isTourActive = active;
      if (active) {
        this.updateHighlight();
      }
    });

    this.helpService.currentTourStep$.subscribe((step) => {
      this.currentStep = step;
      this.currentTourStep = this.helpService.getCurrentTourStep();
      this.totalSteps = this.helpService.getTourSteps().length;
      this.updateHighlight();
    });
  }

  updateHighlight(): void {
    if (!this.currentTourStep) return;

    const target = document.querySelector(this.currentTourStep.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      const padding = this.currentTourStep.highlightPadding || 10;

      this.highlightBox = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        padding: padding
      };
    }
  }

  nextStep(): void {
    this.helpService.nextTourStep();
  }

  previousStep(): void {
    this.helpService.previousTourStep();
  }

  skipTour(): void {
    this.helpService.endTour();
  }

  getProgress(): string {
    return `${this.currentStep + 1} / ${this.totalSteps}`;
  }
}
