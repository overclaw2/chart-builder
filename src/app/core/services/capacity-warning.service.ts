import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Compartment, Container } from '../models/container.model';

export interface CapacityThreshold {
  compartmentId: string;
  weightThreshold: number; // percentage (0-100, default 90)
  widthThreshold: number;  // percentage (0-100, default 90)
}

export interface CapacityWarning {
  compartmentId: string;
  type: 'weight' | 'width';
  currentUtilization: number;
  threshold: number;
  level: 'yellow' | 'red' | 'danger'; // yellow: 70-90%, red: 90-100%, danger: >100%
}

@Injectable({
  providedIn: 'root',
})
export class CapacityWarningService {
  private thresholds = new Map<string, CapacityThreshold>();
  private warnings$ = new BehaviorSubject<CapacityWarning[]>([]);
  private strictMode$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Load from localStorage if available
    const savedThresholds = localStorage.getItem('capacityThresholds');
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds);
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          this.thresholds.set(key, value);
        });
      } catch (e) {
        console.warn('Failed to load capacity thresholds', e);
      }
    }
  }

  /**
   * Update threshold for a compartment
   */
  setThreshold(compartmentId: string, weightThreshold: number, widthThreshold: number): void {
    this.thresholds.set(compartmentId, { compartmentId, weightThreshold, widthThreshold });
    this.persistThresholds();
  }

  /**
   * Get threshold for a compartment (returns defaults if not set)
   */
  getThreshold(compartmentId: string): CapacityThreshold {
    return this.thresholds.get(compartmentId) || {
      compartmentId,
      weightThreshold: 90,
      widthThreshold: 90,
    };
  }

  /**
   * Toggle strict mode (prevents drops that exceed limits)
   */
  setStrictMode(enabled: boolean): void {
    this.strictMode$.next(enabled);
    localStorage.setItem('capacityStrictMode', JSON.stringify(enabled));
  }

  getStrictMode(): Observable<boolean> {
    return this.strictMode$;
  }

  /**
   * Check if a compartment would exceed capacity
   */
  wouldExceedCapacity(
    compartmentId: string,
    additionalWeightKg: number,
    additionalWidthMcm: number,
    compartment: Compartment
  ): { exceedsWeight: boolean; exceedsWidth: boolean } {
    const threshold = this.getThreshold(compartmentId);
    const projectedWeightUtilization = ((compartment.weightKg + additionalWeightKg) / compartment.totalCapacity) * 100;
    const projectedWidthUtilization = ((compartment.widthMcm + additionalWidthMcm) / compartment.widthMcm) * 100; // Note: compartment.widthMcm is the range

    return {
      exceedsWeight: projectedWeightUtilization > 100,
      exceedsWidth: projectedWidthUtilization > 100,
    };
  }

  /**
   * Calculate warning level for a compartment
   */
  calculateWarningLevel(utilization: number): 'none' | 'yellow' | 'red' | 'danger' {
    if (utilization > 100) return 'danger';
    if (utilization >= 90) return 'red';
    if (utilization >= 70) return 'yellow';
    return 'none';
  }

  /**
   * Get warning color based on level
   */
  getWarningColor(level: 'none' | 'yellow' | 'red' | 'danger'): string {
    switch (level) {
      case 'none':
        return '#4ade80'; // Green
      case 'yellow':
        return '#eab308'; // Yellow
      case 'red':
        return '#ef4444'; // Red
      case 'danger':
        return '#dc2626'; // Dark Red
    }
  }

  /**
   * Update warnings based on current compartments
   */
  updateWarnings(containers: Container[]): void {
    const warnings: CapacityWarning[] = [];

    containers.forEach((container) => {
      container.compartments.forEach((comp) => {
        const threshold = this.getThreshold(comp.id);

        // Check weight warnings
        if (comp.weightUtilization >= threshold.weightThreshold) {
          warnings.push({
            compartmentId: comp.id,
            type: 'weight',
            currentUtilization: comp.weightUtilization,
            threshold: threshold.weightThreshold,
            level: this.calculateWarningLevel(comp.weightUtilization) as 'yellow' | 'red' | 'danger',
          });
        }

        // Check width warnings
        if (comp.widthUtilization >= threshold.widthThreshold) {
          warnings.push({
            compartmentId: comp.id,
            type: 'width',
            currentUtilization: comp.widthUtilization,
            threshold: threshold.widthThreshold,
            level: this.calculateWarningLevel(comp.widthUtilization) as 'yellow' | 'red' | 'danger',
          });
        }
      });
    });

    this.warnings$.next(warnings);
  }

  /**
   * Get current warnings observable
   */
  getWarnings(): Observable<CapacityWarning[]> {
    return this.warnings$.asObservable();
  }

  /**
   * Get warnings for specific compartment
   */
  getCompartmentWarnings(compartmentId: string): CapacityWarning[] {
    return this.warnings$.getValue().filter((w) => w.compartmentId === compartmentId);
  }

  /**
   * Persist thresholds to localStorage
   */
  private persistThresholds(): void {
    const data: Record<string, CapacityThreshold> = {};
    this.thresholds.forEach((value, key) => {
      data[key] = value;
    });
    localStorage.setItem('capacityThresholds', JSON.stringify(data));
  }

  /**
   * Reset all thresholds to defaults
   */
  resetThresholds(): void {
    this.thresholds.clear();
    localStorage.removeItem('capacityThresholds');
  }
}
