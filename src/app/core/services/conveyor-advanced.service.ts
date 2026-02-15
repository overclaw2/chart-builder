import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ConveyorConfigAdvanced,
  ConveyorAdvanced,
  ConveyorAreaAdvanced,
  ConveyorSection,
} from '../models/conveyor-advanced.model';

@Injectable({
  providedIn: 'root',
})
export class ConveyorAdvancedService {
  private configSubject = new BehaviorSubject<ConveyorConfigAdvanced | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadDefaultConfig();
  }

  /**
   * Load default advanced conveyor configuration from assets/conveyorConfig.json
   */
  private loadDefaultConfig(): void {
    console.log('🔍 ConveyorAdvancedService: Attempting to load configuration...');
    
    // Load from assets/conveyorConfig.json (note: exact filename - "convayor" typo is in the file)
    this.http
      .get<ConveyorConfigAdvanced>('assets/conveyorConfig.json')
      .subscribe(
        (config) => {
          console.log('✅ ConveyorAdvancedService: Configuration loaded successfully!', config);
          console.log('📊 Conveyor data:', config.conveyors);
          if (config.conveyors && config.conveyors.length > 0) {
            console.log('📝 First conveyor name:', config.conveyors[0].conveyorName);
          }
          this.validateConfig(config);
          this.configSubject.next(config);
        },
        (error) => {
          console.error('❌ ConveyorAdvancedService: Failed to load default conveyor config from assets/conveyorConfig.json:', error);
          // Fallback to empty config
          this.configSubject.next({ convayor: [] });
        }
      );
  }

  /**
   * Load configuration from JSON file
   */
  loadConfigFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(
            event.target?.result as string
          ) as ConveyorConfigAdvanced;
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
  loadConfigFromData(configData: ConveyorConfigAdvanced): void {
    this.validateConfig(configData);
    this.configSubject.next(configData);
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: ConveyorConfigAdvanced): void {
    if (!config.convayor || !Array.isArray(config.convayor)) {
      throw new Error('Invalid config: convayor must be an array');
    }

    for (const conveyor of config.convayor) {
      if (!conveyor.conveyorId || !conveyor.conveyorName || !Array.isArray(conveyor.Area)) {
        throw new Error(
          'Invalid config: each conveyor must have conveyorId, conveyorName, and Area array'
        );
      }

      for (const area of conveyor.Area) {
        if (!area.name || area.startWidthIndex === undefined || area.stopWidthIndex === undefined) {
          throw new Error('Invalid config: each area must have name, startWidthIndex, and stopWidthIndex');
        }

        if (!Array.isArray(area.Sections)) {
          throw new Error('Invalid config: each area must have Sections array');
        }

        for (const section of area.Sections) {
          if (!section.name || section.startWidthIndex === undefined || section.stopWidthIndex === undefined) {
            throw new Error(
              'Invalid config: each section must have name, startWidthIndex, and stopWidthIndex'
            );
          }

          if (!Array.isArray(section.cells)) {
            throw new Error('Invalid config: each section must have cells array');
          }
        }
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ConveyorConfigAdvanced | null {
    return this.configSubject.value;
  }

  /**
   * Get specific conveyor by ID
   */
  getConveyor(conveyorId: string): ConveyorAdvanced | undefined {
    return this.configSubject.value?.convayor.find((c) => c.conveyorId === conveyorId);
  }

  /**
   * Get specific area within a conveyor
   */
  getArea(conveyorId: string, areaName: string): ConveyorAreaAdvanced | undefined {
    const conveyor = this.getConveyor(conveyorId);
    return conveyor?.Area.find((a) => a.name === areaName);
  }

  /**
   * Get specific section within an area
   */
  getSection(conveyorId: string, areaName: string, sectionName: string): ConveyorSection | undefined {
    const area = this.getArea(conveyorId, areaName);
    return area?.Sections.find((s) => s.name === sectionName);
  }

  /**
   * Get all conveyors
   */
  getConveyors(): ConveyorAdvanced[] {
    return this.configSubject.value?.convayor || [];
  }

  /**
   * Get all areas for a conveyor
   */
  getAreas(conveyorId: string): ConveyorAreaAdvanced[] {
    return this.getConveyor(conveyorId)?.Area || [];
  }

  /**
   * Get all sections for an area
   */
  getSections(conveyorId: string, areaName: string): ConveyorSection[] {
    return this.getArea(conveyorId, areaName)?.Sections || [];
  }

  /**
   * Get all cells for a section
   */
  getCells(conveyorId: string, areaName: string, sectionName: string) {
    return this.getSection(conveyorId, areaName, sectionName)?.cells || [];
  }

  /**
   * Find available cell for allocation
   */
  findAvailableCell(conveyorId: string, areaName: string, sectionName: string): number | null {
    const cells = this.getCells(conveyorId, areaName, sectionName);
    const availableCell = cells.find((cell) => cell.occupiedBy === null);
    return availableCell ? availableCell.index : null;
  }

  /**
   * Allocate cell to a package
   */
  allocateCell(conveyorId: string, areaName: string, sectionName: string, cellIndex: number, packageId: string): boolean {
    const cell = this.getCells(conveyorId, areaName, sectionName).find((c) => c.index === cellIndex);
    if (cell && cell.occupiedBy === null) {
      cell.occupiedBy = packageId;
      this.configSubject.next(this.configSubject.value!);
      return true;
    }
    return false;
  }

  /**
   * Deallocate cell from a package
   */
  deallocateCell(conveyorId: string, areaName: string, sectionName: string, cellIndex: number): boolean {
    const cell = this.getCells(conveyorId, areaName, sectionName).find((c) => c.index === cellIndex);
    if (cell) {
      cell.occupiedBy = null;
      this.configSubject.next(this.configSubject.value!);
      return true;
    }
    return false;
  }
}
