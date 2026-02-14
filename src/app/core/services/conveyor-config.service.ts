import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConveyorConfig, Conveyor, ConveyorArea } from '../models/conveyor.model';

@Injectable({
  providedIn: 'root'
})
export class ConveyorConfigService {
  private configSubject = new BehaviorSubject<ConveyorConfig | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor() {
    this.loadDefaultConfig();
  }

  /**
   * Load default conveyor configuration
   */
  private loadDefaultConfig(): void {
    const defaultConfig: ConveyorConfig = {
      conveyors: [
        {
          id: '1',
          name: 'Conveyor 1',
          areas: [
            { id: 'A', start: 1000, end: 1900 },
            { id: 'B', start: 1900, end: 2800 },
            { id: 'C', start: 2800, end: 3700 },
            { id: 'D', start: 3700, end: 4600 },
          ],
        },
        {
          id: '2',
          name: 'Conveyor 2',
          areas: [
            { id: 'A', start: 1000, end: 1900 },
            { id: 'B', start: 1900, end: 2800 },
            { id: 'C', start: 2800, end: 3700 },
            { id: 'D', start: 3700, end: 4600 },
          ],
        },
      ],
      level4_config: {
        total_cells: 45,
        cell_width: 5,
      },
    };
    this.configSubject.next(defaultConfig);
  }

  /**
   * Load configuration from JSON file
   */
  loadConfigFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string) as ConveyorConfig;
          this.validateConfig(config);
          this.configSubject.next(config);
          resolve();
        } catch (error) {
          reject(new Error(`Failed to load configuration: ${error}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Load configuration from JSON data
   */
  loadConfigFromData(configData: ConveyorConfig): void {
    this.validateConfig(configData);
    this.configSubject.next(configData);
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: ConveyorConfig): void {
    if (!config.conveyors || !Array.isArray(config.conveyors)) {
      throw new Error('Invalid config: conveyors must be an array');
    }
    if (!config.level4_config) {
      throw new Error('Invalid config: level4_config is required');
    }
    if (!config.level4_config.total_cells || !config.level4_config.cell_width) {
      throw new Error('Invalid config: level4_config must have total_cells and cell_width');
    }

    for (const conveyor of config.conveyors) {
      if (!conveyor.id || !conveyor.name || !Array.isArray(conveyor.areas)) {
        throw new Error('Invalid config: each conveyor must have id, name, and areas array');
      }
      for (const area of conveyor.areas) {
        if (!area.id || area.start === undefined || area.end === undefined) {
          throw new Error('Invalid config: each area must have id, start, and end');
        }
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ConveyorConfig | null {
    return this.configSubject.value;
  }

  /**
   * Get specific conveyor by ID
   */
  getConveyor(conveyorId: string): Conveyor | undefined {
    return this.configSubject.value?.conveyors.find(c => c.id === conveyorId);
  }

  /**
   * Get specific area within a conveyor
   */
  getArea(conveyorId: string, areaId: string): ConveyorArea | undefined {
    const conveyor = this.getConveyor(conveyorId);
    return conveyor?.areas.find(a => a.id === areaId);
  }

  /**
   * Calculate section index width range
   * Areas are divided into 4 equal sections
   */
  calculateSectionRange(
    areaStart: number,
    areaEnd: number,
    sectionNumber: number // 1-4
  ): { start: number; end: number } {
    const totalRange = areaEnd - areaStart;
    const sectionSize = totalRange / 4;
    const start = areaStart + sectionSize * (sectionNumber - 1);
    const end = areaStart + sectionSize * sectionNumber;
    return { start, end };
  }

  /**
   * Calculate cell index width (Mcm) for a given cell index
   */
  calculateCellIndexWidth(sectionStart: number, cellIndex: number, cellWidth: number): number {
    return sectionStart + cellIndex * cellWidth;
  }

  /**
   * Get total cells count from configuration
   */
  getTotalCells(): number {
    return this.configSubject.value?.level4_config.total_cells || 45;
  }

  /**
   * Get cell width from configuration
   */
  getCellWidth(): number {
    return this.configSubject.value?.level4_config.cell_width || 5;
  }
}
