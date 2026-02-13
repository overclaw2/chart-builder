import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReducePipe } from '../../shared/pipes/reduce.pipe';
import { Item } from '../../core/models/container.model';

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ColumnMapping {
  csvColumn: string;
  packageField: 'name' | 'weight' | 'destination' | 'dimensions' | 'ignore';
}

interface ParsedRow {
  [key: string]: any;
}

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule, ReducePipe],
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.css'],
})
export class BulkImportComponent implements OnInit {
  @Input() existingPackages: Item[] = [];
  @Output() packagesImported = new EventEmitter<Item[]>();
  @Output() importClosed = new EventEmitter<void>();

  // UI State
  isModalOpen = false;
  currentStep: 'upload' | 'mapping' | 'validation' | 'preview' | 'import' = 'upload';
  isProcessing = false;

  // File & CSV Data
  selectedFile: File | null = null;
  csvData: ParsedRow[] = [];
  csvHeaders: string[] = [];
  delimiter: ',' | ';' | '\t' = ',';

  // Column Mapping
  columnMappings: ColumnMapping[] = [];
  requiredFieldsMapped = false;

  // Validation
  validationErrors: ImportError[] = [];
  validatedPackages: Item[] = [];
  duplicateIds: string[] = [];
  successCount = 0;

  // Preview
  previewPageSize = 5;
  previewCurrentPage = 0;

  // localStorage persistence
  private readonly STORAGE_KEY = 'bulk-import-state';

  ngOnInit(): void {
    this.loadState();
  }

  // ==================== UPLOAD STEP ====================

  openImportModal(): void {
    this.isModalOpen = true;
    this.currentStep = 'upload';
    this.resetState();
  }

  closeImportModal(): void {
    this.isModalOpen = false;
    this.importClosed.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?|tsv|txt)$/i)) {
      alert('❌ Please upload a CSV or Excel file');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.parseCSVFile();
  }

  // CSV Parsing with support for multiple delimiters
  private parseCSVFile(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        this.csvData = this.parseCSV(content, this.delimiter);
        
        if (this.csvData.length === 0) {
          alert('❌ File is empty or could not be parsed');
          return;
        }

        this.csvHeaders = Object.keys(this.csvData[0] || {});
        this.initializeColumnMappings();
        this.currentStep = 'mapping';
        this.saveState();
      } catch (error) {
        alert(`❌ Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(this.selectedFile);
  }

  private parseCSV(content: string, delimiter: string): ParsedRow[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = this.parseCsvLine(lines[0], delimiter);
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = this.parseCsvLine(line, delimiter);
      const row: ParsedRow = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      rows.push(row);
    }

    return rows;
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  onDelimiterChange(): void {
    if (this.selectedFile) {
      this.parseCSVFile();
    }
  }

  // ==================== MAPPING STEP ====================

  private initializeColumnMappings(): void {
    this.columnMappings = this.csvHeaders.map((header) => ({
      csvColumn: header,
      packageField: this.autoDetectField(header),
    }));
    this.checkRequiredFieldsMapped();
  }

  private autoDetectField(
    header: string
  ): 'name' | 'weight' | 'destination' | 'dimensions' | 'ignore' {
    const lower = header.toLowerCase();

    if (lower.includes('name') || lower.includes('product')) return 'name';
    if (lower.includes('weight') || lower.includes('kg') || lower.includes('mass'))
      return 'weight';
    if (lower.includes('destination') || lower.includes('port') || lower.includes('to'))
      return 'destination';
    if (lower.includes('dimension') || lower.includes('mcm') || lower.includes('size'))
      return 'dimensions';

    return 'ignore';
  }

  onMappingChange(): void {
    this.checkRequiredFieldsMapped();
    this.saveState();
  }

  private checkRequiredFieldsMapped(): void {
    const mappedFields = this.columnMappings
      .map((m) => m.packageField)
      .filter((f) => f !== 'ignore');

    this.requiredFieldsMapped =
      mappedFields.includes('name') &&
      mappedFields.includes('weight') &&
      mappedFields.includes('destination') &&
      mappedFields.includes('dimensions');
  }

  proceedToValidation(): void {
    if (!this.requiredFieldsMapped) {
      alert('⚠️ Please map all required fields (Name, Weight, Destination, Dimensions)');
      return;
    }

    this.validateAndProceed();
  }

  // ==================== VALIDATION STEP ====================

  private validateAndProceed(): void {
    this.isProcessing = true;
    this.validationErrors = [];
    this.validatedPackages = [];
    this.duplicateIds = [];

    setTimeout(() => {
      try {
        this.csvData.forEach((row, index) => {
          const errors = this.validateRow(row, index);
          if (errors.length === 0) {
            const item = this.createPackageFromRow(row);
            this.validatedPackages.push(item);
          } else {
            this.validationErrors.push(...errors);
          }
        });

        // Check for duplicates
        this.checkForDuplicates();

        if (this.validationErrors.length === 0 && this.validatedPackages.length > 0) {
          this.currentStep = 'preview';
        } else {
          this.currentStep = 'validation';
        }

        this.isProcessing = false;
        this.saveState();
      } catch (error) {
        alert(`❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.isProcessing = false;
      }
    }, 500);
  }

  private validateRow(row: ParsedRow, rowIndex: number): ImportError[] {
    const errors: ImportError[] = [];
    const rowNum = rowIndex + 2; // +2 because of header row and 1-based indexing

    // Get mapped values
    const nameMapping = this.columnMappings.find((m) => m.packageField === 'name');
    const weightMapping = this.columnMappings.find((m) => m.packageField === 'weight');
    const destinationMapping = this.columnMappings.find((m) => m.packageField === 'destination');
    const dimensionsMapping = this.columnMappings.find((m) => m.packageField === 'dimensions');

    // Validate Name (required, string)
    if (nameMapping) {
      const nameValue = row[nameMapping.csvColumn]?.toString().trim();
      if (!nameValue) {
        errors.push({
          row: rowNum,
          field: 'Name',
          message: 'Name is required',
          value: nameValue,
        });
      }
    }

    // Validate Weight (required, positive number)
    if (weightMapping) {
      const weightValue = row[weightMapping.csvColumn];
      const weightNum = parseFloat(weightValue);
      if (!weightValue || isNaN(weightNum) || weightNum <= 0) {
        errors.push({
          row: rowNum,
          field: 'Weight',
          message: 'Weight must be a positive number',
          value: weightValue,
        });
      } else if (weightNum > 1000) {
        errors.push({
          row: rowNum,
          field: 'Weight',
          message: 'Weight exceeds maximum limit (1000 kg)',
          value: weightValue,
        });
      }
    }

    // Validate Destination (required, string)
    if (destinationMapping) {
      const destValue = row[destinationMapping.csvColumn]?.toString().trim();
      if (!destValue) {
        errors.push({
          row: rowNum,
          field: 'Destination',
          message: 'Destination is required',
          value: destValue,
        });
      } else if (destValue.length < 2) {
        errors.push({
          row: rowNum,
          field: 'Destination',
          message: 'Destination must be at least 2 characters',
          value: destValue,
        });
      }
    }

    // Validate Dimensions (required, positive number)
    if (dimensionsMapping) {
      const dimValue = row[dimensionsMapping.csvColumn];
      const dimNum = parseFloat(dimValue);
      if (!dimValue || isNaN(dimNum) || dimNum <= 0) {
        errors.push({
          row: rowNum,
          field: 'Dimensions',
          message: 'Dimensions must be a positive number',
          value: dimValue,
        });
      } else if (dimNum > 500) {
        errors.push({
          row: rowNum,
          field: 'Dimensions',
          message: 'Dimensions exceed maximum limit (500 Mcm)',
          value: dimValue,
        });
      }
    }

    return errors;
  }

  private checkForDuplicates(): void {
    const existingIds = new Set(this.existingPackages.map((p) => p.id.toLowerCase()));

    this.validatedPackages.forEach((pkg) => {
      if (existingIds.has(pkg.id.toLowerCase())) {
        this.duplicateIds.push(pkg.id);
        // Remove duplicate from validated packages
        const index = this.validatedPackages.indexOf(pkg);
        if (index > -1) {
          this.validatedPackages.splice(index, 1);
        }
      }
    });
  }

  retryValidation(): void {
    this.resetValidationState();
    this.currentStep = 'mapping';
  }

  // ==================== PREVIEW STEP ====================

  getPreviewedPackages(): Item[] {
    const start = this.previewCurrentPage * this.previewPageSize;
    const end = start + this.previewPageSize;
    return this.validatedPackages.slice(start, end);
  }

  getTotalPreviewPages(): number {
    return Math.ceil(this.validatedPackages.length / this.previewPageSize);
  }

  onPreviousPage(): void {
    if (this.previewCurrentPage > 0) {
      this.previewCurrentPage--;
    }
  }

  onNextPage(): void {
    if (this.previewCurrentPage < this.getTotalPreviewPages() - 1) {
      this.previewCurrentPage++;
    }
  }

  proceedToImport(): void {
    if (this.validatedPackages.length === 0) {
      alert('❌ No valid packages to import');
      return;
    }

    this.currentStep = 'import';
    this.performBulkImport();
  }

  // ==================== IMPORT STEP ====================

  private performBulkImport(): void {
    this.isProcessing = true;
    this.successCount = 0;

    setTimeout(() => {
      try {
        // Add all validated packages
        this.successCount = this.validatedPackages.length;
        
        // Emit the imported packages
        this.packagesImported.emit(this.validatedPackages);

        // Show success message and auto-close
        setTimeout(() => {
          this.closeImportModal();
          this.resetState();
        }, 1500);
      } catch (error) {
        alert(`❌ Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        this.isProcessing = false;
      }
    }, 800);
  }

  // ==================== UTILITY METHODS ====================

  private createPackageFromRow(row: ParsedRow): Item {
    const nameMapping = this.columnMappings.find((m) => m.packageField === 'name');
    const weightMapping = this.columnMappings.find((m) => m.packageField === 'weight');
    const destinationMapping = this.columnMappings.find((m) => m.packageField === 'destination');
    const dimensionsMapping = this.columnMappings.find((m) => m.packageField === 'dimensions');

    const name = nameMapping ? row[nameMapping.csvColumn]?.toString().trim() : 'Unknown';
    const weight = weightMapping ? parseFloat(row[weightMapping.csvColumn]) : 0;
    const destination = destinationMapping ? row[destinationMapping.csvColumn]?.toString().trim() : 'UNKNOWN';
    const dimensions = dimensionsMapping ? parseFloat(row[dimensionsMapping.csvColumn]) : 0;

    // Generate unique ID based on name and timestamp
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 5);
    const uniqueId = `pkg-${timestamp}-${randomPart}`;

    return {
      id: uniqueId,
      name,
      weightKg: weight,
      destination: destination.toUpperCase(),
      dimensionMcm: dimensions,
      position: 0,
      length: 500,
      color: this.getRandomPackageColor(),
    };
  }

  private getRandomPackageColor(): string {
    const colors = [
      '#a1d8ff',
      '#94f3f5',
      '#86efac',
      '#fca5a5',
      '#fed7aa',
      '#d1d5db',
      '#c4b5fd',
      '#f472b6',
      '#60a5fa',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private resetState(): void {
    this.selectedFile = null;
    this.csvData = [];
    this.csvHeaders = [];
    this.columnMappings = [];
    this.resetValidationState();
    this.previewCurrentPage = 0;
    this.delimiter = ',';
  }

  private resetValidationState(): void {
    this.validationErrors = [];
    this.validatedPackages = [];
    this.duplicateIds = [];
    this.successCount = 0;
  }

  // localStorage integration
  private saveState(): void {
    const state = {
      columnMappings: this.columnMappings,
      delimiter: this.delimiter,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  private loadState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.delimiter = state.delimiter || ',';
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // UI Helper Methods
  canProceedToValidation(): boolean {
    return this.requiredFieldsMapped && this.csvData.length > 0;
  }

  canProceedToImport(): boolean {
    return this.validatedPackages.length > 0 && this.validationErrors.length === 0;
  }

  getErrorsForRow(rowNum: number): ImportError[] {
    return this.validationErrors.filter((e) => e.row === rowNum);
  }

  getDuplicatesForPackage(packageId: string): boolean {
    return this.duplicateIds.includes(packageId);
  }

  getValidationStats(): { total: number; valid: number; errors: number; duplicates: number } {
    return {
      total: this.csvData.length,
      valid: this.validatedPackages.length,
      errors: this.validationErrors.length > 0 ? this.csvData.length - this.validatedPackages.length : 0,
      duplicates: this.duplicateIds.length,
    };
  }

  // Helper methods for template
  isNameMapped(): boolean {
    return this.columnMappings.some((m) => m.packageField === 'name');
  }

  isWeightMapped(): boolean {
    return this.columnMappings.some((m) => m.packageField === 'weight');
  }

  isDestinationMapped(): boolean {
    return this.columnMappings.some((m) => m.packageField === 'destination');
  }

  isDimensionsMapped(): boolean {
    return this.columnMappings.some((m) => m.packageField === 'dimensions');
  }
}
