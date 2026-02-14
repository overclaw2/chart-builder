import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConveyorCellAllocatorComponent } from './conveyor-cell-allocator.component';
import { ConveyorConfigService } from '../../core/services/conveyor-config.service';
import { ConveyorStateService } from '../../core/services/conveyor-state.service';
import { PackageData } from '../../core/models/conveyor.model';

describe('ConveyorCellAllocatorComponent', () => {
  let component: ConveyorCellAllocatorComponent;
  let fixture: ComponentFixture<ConveyorCellAllocatorComponent>;
  let configService: ConveyorConfigService;
  let stateService: ConveyorStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConveyorCellAllocatorComponent],
      providers: [ConveyorConfigService, ConveyorStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(ConveyorCellAllocatorComponent);
    component = fixture.componentInstance;
    configService = TestBed.inject(ConveyorConfigService);
    stateService = TestBed.inject(ConveyorStateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load default configuration', (done) => {
    configService.config$.subscribe((config) => {
      if (config) {
        expect(config.conveyors.length).toBeGreaterThan(0);
        expect(config.level4_config.total_cells).toBeGreaterThan(0);
        done();
      }
    });
  });

  it('should initialize UI state when package data is provided', () => {
    const packageData: PackageData = {
      id: 'pkg-1',
      name: 'Test Package',
      category: 'Electronics',
      width: 100,
      cells: 5,
      color: '#ff0000',
    };

    component.packageData = packageData;
    component.ngOnInit();

    expect(component.uiState.currentPackage).toEqual(packageData);
    expect(component.uiState.mode).toBe('new');
  });

  it('should detect edit mode when package has allocation', () => {
    const packageData: PackageData = {
      id: 'pkg-1',
      name: 'Test Package',
      category: 'Electronics',
      width: 100,
      cells: 5,
      color: '#ff0000',
      allocation: {
        conveyorId: '1',
        areaId: 'A',
        sectionId: '1-A-1',
        cellIndices: [0, 1, 2, 3, 4],
      },
    };

    component.packageData = packageData;
    component.ngOnInit();

    expect(component.uiState.mode).toBe('edit');
    expect(component.uiState.originalAllocation).toBeDefined();
  });

  it('should toggle conveyor selection', () => {
    component.ngOnInit();
    const conveyorId = '1';

    component.toggleConveyor(conveyorId);
    expect(component.uiState.activeConveyor).toBe(conveyorId);

    component.toggleConveyor(conveyorId);
    expect(component.uiState.activeConveyor).toBeNull();
  });

  it('should toggle area selection', () => {
    component.ngOnInit();
    component.uiState.activeConveyor = '1';

    const areaId = 'A';
    component.toggleArea(areaId);
    expect(component.uiState.activeArea).toBe(areaId);

    component.toggleArea(areaId);
    expect(component.uiState.activeArea).toBeNull();
  });

  it('should toggle section open/close', () => {
    const sectionId = '1-A-1';

    component.toggleSection(sectionId);
    expect(component.isSectionOpen(sectionId)).toBe(true);

    component.toggleSection(sectionId);
    expect(component.isSectionOpen(sectionId)).toBe(false);
  });

  it('should calculate section range correctly', () => {
    const range = component.getSectionRange(1000, 1900, 1);
    expect(range.start).toBe(1000);
    expect(range.end).toBe(1225);
  });

  it('should enable allocate button only with valid selection', () => {
    const packageData: PackageData = {
      id: 'pkg-1',
      name: 'Test Package',
      category: 'Electronics',
      width: 100,
      cells: 5,
      color: '#ff0000',
    };

    component.packageData = packageData;
    component.ngOnInit();

    // No selection - should be disabled
    expect(component.isAllocateButtonEnabled()).toBe(false);

    // Valid selection - should be enabled
    component.uiState.selectedCells = {
      sectionId: '1-A-1',
      cellIndices: [0, 1, 2, 3, 4],
    };
    expect(component.isAllocateButtonEnabled()).toBe(true);

    // Wrong count - should be disabled
    component.uiState.selectedCells = {
      sectionId: '1-A-1',
      cellIndices: [0, 1],
    };
    expect(component.isAllocateButtonEnabled()).toBe(false);
  });

  it('should allocate cells and emit result', (done) => {
    const packageData: PackageData = {
      id: 'pkg-1',
      name: 'Test Package',
      category: 'Electronics',
      width: 100,
      cells: 5,
      color: '#ff0000',
    };

    component.packageData = packageData;
    component.ngOnInit();
    component.uiState.activeConveyor = '1';
    component.uiState.activeArea = 'A';
    component.uiState.selectedCells = {
      sectionId: '1-A-1',
      cellIndices: [0, 1, 2, 3, 4],
    };

    component.allocationComplete.subscribe((result) => {
      expect(result.packageId).toBe('pkg-1');
      expect(result.conveyorId).toBe('1');
      expect(result.areaId).toBe('A');
      expect(result.success).toBe(true);
      done();
    });

    component.onAllocate();
  });
});
