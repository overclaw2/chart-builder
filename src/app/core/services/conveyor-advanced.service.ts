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
    console.log('✅ ConveyorAdvancedService initialized - NO auto-load. Waiting for user to upload conveyorConfig.json');
  }

  /**
   * Normalize config: convert "conveyors" to "convayor" and "Areas" to "Area" if needed
   */
  private normalizeConfig(config: any): ConveyorConfigAdvanced {
    let normalized = config;
    
    // Normalize top-level property: "conveyors" → "convayor"
    if (config.conveyors && !config.convayor) {
      console.log('⚠️ Config uses "conveyors" property, normalizing to "convayor" for consistency');
      normalized = {
        ...config,
        convayor: config.conveyors
      };
      delete normalized.conveyors;
    }
    
    // Normalize conveyor-level property: "Areas" → "Area"
    if (normalized.convayor && Array.isArray(normalized.convayor)) {
      normalized.convayor = normalized.convayor.map((conveyor: any) => {
        if (conveyor.Areas && !conveyor.Area) {
          console.log(`⚠️ Conveyor "${conveyor.conveyorName}" uses "Areas" property, normalizing to "Area"`);
          return {
            ...conveyor,
            Area: conveyor.Areas
          };
        }
        return conveyor;
      });
    }
    
    return normalized as ConveyorConfigAdvanced;
  }

  /**
   * Load configuration from JSON file
   */
  loadConfigFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const rawConfig = JSON.parse(
            event.target?.result as string
          );
          const config = this.normalizeConfig(rawConfig);
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
    const normalized = this.normalizeConfig(configData);
    this.validateConfig(normalized);
    this.configSubject.next(normalized);
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
