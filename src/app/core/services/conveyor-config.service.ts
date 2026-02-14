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
          conveyorId: '1',
          conveyorName: 'Conveyor 1',
          Areas: [
            { name: 'A', startWidthIndex: 1000, stopWidthIndex: 1900 },
            { name: 'B', startWidthIndex: 1900, stopWidthIndex: 2800 },
            { name: 'C', startWidthIndex: 2800, stopWidthIndex: 3700 },
            { name: 'D', startWidthIndex: 3700, stopWidthIndex: 4600 },
          ],
        },
        {
          conveyorId: '2',
          conveyorName: 'Conveyor 2',
          Areas: [
            { name: 'A', startWidthIndex: 1000, stopWidthIndex: 1900 },
            { name: 'B', startWidthIndex: 1900, stopWidthIndex: 2800 },
            { name: 'C', startWidthIndex: 2800, stopWidthIndex: 3700 },
            { name: 'D', startWidthIndex: 3700, stopWidthIndex: 4600 },
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
  loadConfigFromData(configData: any): void {
    // Support both "conveyors" and "convayor" key names (handle typo variants)
    const normalizedConfig = this.normalizeConfig(configData);
    this.validateConfig(normalizedConfig);
    this.configSubject.next(normalizedConfig as ConveyorConfig);
  }

  /**
   * Normalize configuration: convert "convayor" to "conveyors" if needed
   */
  private normalizeConfig(config: any): any {
    if (config.convayor && !config.conveyors) {
      return {
        ...config,
        conveyors: config.convayor
      };
    }
    return config;
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: any): void {
    if (!config.conveyors || !Array.isArray(config.conveyors)) {
      throw new Error('Invalid config: conveyors must be an array');
    }
    
    // level4_config is optional if detailed cells data is provided
    if (config.level4_config) {
      if (!config.level4_config.total_cells || !config.level4_config.cell_width) {
        throw new Error('Invalid config: level4_config must have total_cells and cell_width');
      }
    }

    for (const conveyor of config.conveyors) {
      if (!conveyor.conveyorId || !conveyor.conveyorName) {
        throw new Error('Invalid config: each conveyor must have conveyorId and conveyorName');
      }
      if (!Array.isArray(conveyor.Areas)) {
        throw new Error('Invalid config: each conveyor must have Areas array');
      }
      
      for (const area of conveyor.Areas) {
        if (!area.name || area.startWidthIndex === undefined || area.stopWidthIndex === undefined) {
          throw new Error('Invalid config: each area must have name, startWidthIndex, and stopWidthIndex');
        }
        
        // Sections are optional but if present must be valid
        if (area.Sections && Array.isArray(area.Sections)) {
          for (const section of area.Sections) {
            if (!section.name || section.startWidthIndex === undefined || section.stopWidthIndex === undefined) {
              throw new Error('Invalid config: each section must have name, startWidthIndex, and stopWidthIndex');
            }
            
            // Cells are optional but if present must be valid
            if (section.cells && Array.isArray(section.cells)) {
              for (const cell of section.cells) {
                if (cell.index === undefined || cell.centralWidthIndex === undefined || cell.occupiedBy === undefined) {
                  throw new Error('Invalid config: each cell must have index, centralWidthIndex, and occupiedBy');
                }
              }
            }
          }
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
    return conveyor?.Areas?.find(a => a.name === areaId || a.id === areaId);
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
    return this.configSubject.value?.level4_config?.total_cells || 45;
  }

  /**
   * Get cell width from configuration
   */
  getCellWidth(): number {
    return this.configSubject.value?.level4_config?.cell_width || 5;
  }
}
