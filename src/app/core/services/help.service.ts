import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  icon?: string;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  action?: string;
  highlightPadding?: number;
}

export interface ContextHelp {
  elementId: string;
  title: string;
  description: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private helpVisible = new BehaviorSubject<boolean>(false);
  private tourActive = new BehaviorSubject<boolean>(false);
  private currentTourStep = new BehaviorSubject<number>(0);
  private contextHelpActive = new BehaviorSubject<string | null>(null);

  helpVisible$ = this.helpVisible.asObservable();
  tourActive$ = this.tourActive.asObservable();
  currentTourStep$ = this.currentTourStep.asObservable();
  contextHelpActive$ = this.contextHelpActive.asObservable();

  private helpItems: HelpItem[] = [
    {
      id: 'drag-drop',
      title: 'Drag & Drop Packages',
      description: 'Click and drag packages from the Available Packages panel to place them in container compartments. You can also drag placed packages to reposition them. Drag from Placed Items to Available to remove them from the container.',
      category: 'Core Features',
      keywords: ['drag', 'drop', 'move', 'package', 'placement'],
      icon: '🖱️'
    },
    {
      id: 'color-picker',
      title: 'Package Colors',
      description: 'Assign colors to packages for visual organization. Click the color input next to any package to choose a color. Colors help distinguish packages visually in the container.',
      category: 'Customization',
      keywords: ['color', 'visual', 'organize', 'package'],
      icon: '🎨'
    },
    {
      id: 'json-upload',
      title: 'Load JSON Data',
      description: 'Import custom container and package data from a JSON file. Click "📤 Load JSON Data" and select your file. Format should match the project data model (containers, compartments, items).',
      category: 'Data Management',
      keywords: ['json', 'import', 'load', 'data', 'file'],
      icon: '📤'
    },
    {
      id: 'bulk-import',
      title: 'Bulk Import CSV/Excel',
      description: 'Import many packages at once from CSV or Excel files. The import wizard guides you through column mapping, validation, and preview before importing. Automatically detects duplicates.',
      category: 'Data Management',
      keywords: ['bulk', 'csv', 'excel', 'import', 'batch'],
      icon: '📦'
    },
    {
      id: 'search-filter',
      title: 'Search & Filter Packages',
      description: 'Click the 🔍 Search & Filter header to expand the search panel. Filter packages by name, destination, ID, weight range, or dimensions. Results update in real-time as you type.',
      category: 'Navigation',
      keywords: ['search', 'filter', 'find', 'locate', 'query'],
      icon: '🔍'
    },
    {
      id: 'history',
      title: 'Undo & Redo History',
      description: 'Click the 📜 History button to open the history viewer. See all your operations in timeline or list view. Jump to any previous state, or use Ctrl+Z (undo) and Ctrl+Y (redo) keyboard shortcuts.',
      category: 'Navigation',
      keywords: ['undo', 'redo', 'history', 'revert', 'timeline'],
      icon: '📜'
    },
    {
      id: 'utilization',
      title: 'Utilization Metrics',
      description: 'Each compartment shows width utilization (how much space is used) and weight utilization (how much capacity is used). Strive for balanced utilization across compartments.',
      category: 'Analytics',
      keywords: ['utilization', 'metrics', 'percentage', 'capacity', 'space'],
      icon: '📊'
    },
    {
      id: 'compartments',
      title: 'Compartments & Ranges',
      description: 'Containers have multiple compartments, each with its own width index range. Packages can only be placed within their assigned compartment. Use the timeline strip to visualize package positions.',
      category: 'Core Concepts',
      keywords: ['compartment', 'range', 'index', 'section', 'container'],
      icon: '📦'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Ctrl+Z: Undo last operation\nCtrl+Y: Redo operation\nCtrl+Shift+Z: Also works for redo (Mac style)\nClick elements to open help.',
      category: 'Tips',
      keywords: ['keyboard', 'shortcut', 'ctrl', 'cmd', 'efficiency'],
      icon: '⌨️'
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'Toggle dark mode by clicking the theme icon in the top right corner. Dark mode reduces eye strain and works across all interface elements.',
      category: 'Settings',
      keywords: ['dark', 'mode', 'theme', 'light', 'appearance'],
      icon: '🌙'
    }
  ];

  private tourSteps: TourStep[] = [
    {
      id: 'tour-1',
      title: 'Welcome to Chart Builder!',
      description: 'This guided tour will show you the main features. You can drag packages from the left panel into compartments on the right.',
      targetSelector: 'body',
      action: 'Click Next to begin',
      highlightPadding: 0
    },
    {
      id: 'tour-2',
      title: 'Available Packages Panel',
      description: 'On the left, you\'ll see the Available Packages list. These are packages ready to be placed in the container. Click and drag any package to start.',
      targetSelector: '.side-panel',
      highlightPadding: 10
    },
    {
      id: 'tour-3',
      title: 'Container Visualization',
      description: 'The main area shows your container with compartments. The timeline strip at the top shows package positions. Drop packages here to place them.',
      targetSelector: '.containers-list',
      highlightPadding: 15
    },
    {
      id: 'tour-4',
      title: 'Search & Filter',
      description: 'Use the Search & Filter panel to find specific packages. Click the 🔍 icon to expand it. Filter by name, destination, weight, or dimensions.',
      targetSelector: '.search-filter-section',
      highlightPadding: 10
    },
    {
      id: 'tour-5',
      title: 'Undo & Redo',
      description: 'Made a mistake? Click the 📜 History button to see all your operations. Jump to any previous state or use Ctrl+Z to undo.',
      targetSelector: '.history-btn',
      highlightPadding: 10
    },
    {
      id: 'tour-6',
      title: 'Bulk Import',
      description: 'Need to add many packages at once? Use Bulk Import to load CSV or Excel files. The wizard guides you through the process step-by-step.',
      targetSelector: '.upload-section',
      highlightPadding: 10
    },
    {
      id: 'tour-complete',
      title: 'You\'re Ready!',
      description: 'You now know the basics. Explore the interface and remember: click the ❓ icon anytime for help on any feature. Happy packing!',
      targetSelector: 'body',
      action: 'Click Finish to complete tour',
      highlightPadding: 0
    }
  ];

  private userBehavior: { [key: string]: number } = {};

  constructor() {
    this.loadUserBehavior();
  }

  /**
   * Show help panel
   */
  showHelp(): void {
    this.helpVisible.next(true);
  }

  /**
   * Hide help panel
   */
  hideHelp(): void {
    this.helpVisible.next(false);
  }

  /**
   * Toggle help visibility
   */
  toggleHelp(): void {
    this.helpVisible.next(!this.helpVisible.value);
  }

  /**
   * Start guided tour
   */
  startTour(): void {
    this.tourActive.next(true);
    this.currentTourStep.next(0);
  }

  /**
   * End guided tour
   */
  endTour(): void {
    this.tourActive.next(false);
    this.currentTourStep.next(0);
  }

  /**
   * Go to next tour step
   */
  nextTourStep(): void {
    const current = this.currentTourStep.value;
    if (current < this.tourSteps.length - 1) {
      this.currentTourStep.next(current + 1);
    } else {
      this.endTour();
    }
  }

  /**
   * Go to previous tour step
   */
  previousTourStep(): void {
    const current = this.currentTourStep.value;
    if (current > 0) {
      this.currentTourStep.next(current - 1);
    }
  }

  /**
   * Get current tour step
   */
  getCurrentTourStep(): TourStep {
    return this.tourSteps[this.currentTourStep.value];
  }

  /**
   * Get all tour steps
   */
  getTourSteps(): TourStep[] {
    return this.tourSteps;
  }

  /**
   * Get all help items
   */
  getHelpItems(): HelpItem[] {
    return this.helpItems;
  }

  /**
   * Search help items
   */
  searchHelp(query: string): HelpItem[] {
    const lowerQuery = query.toLowerCase();
    return this.helpItems.filter((item) => {
      const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
      const matchesDescription = item.description.toLowerCase().includes(lowerQuery);
      const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(lowerQuery));
      return matchesTitle || matchesDescription || matchesKeywords;
    });
  }

  /**
   * Get help by category
   */
  getHelpByCategory(category: string): HelpItem[] {
    return this.helpItems.filter((item) => item.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return [...new Set(this.helpItems.map((item) => item.category))];
  }

  /**
   * Track user behavior
   */
  trackFeatureInteraction(featureId: string): void {
    this.userBehavior[featureId] = (this.userBehavior[featureId] || 0) + 1;
    this.saveUserBehavior();
  }

  /**
   * Get suggested tips based on user behavior
   */
  getSuggestedTips(): HelpItem[] {
    // Find features the user hasn't used much
    const featureIds = new Set(this.helpItems.map((item) => item.id));
    const unused = Array.from(featureIds).filter((id) => (this.userBehavior[id] || 0) < 2);

    // Return help items for unused features (shuffled)
    return unused
      .map((id) => this.helpItems.find((item) => item.id === id)!)
      .filter((item) => item !== undefined)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }

  /**
   * Save user behavior to localStorage
   */
  private saveUserBehavior(): void {
    localStorage.setItem('chart-builder-user-behavior', JSON.stringify(this.userBehavior));
  }

  /**
   * Load user behavior from localStorage
   */
  private loadUserBehavior(): void {
    const saved = localStorage.getItem('chart-builder-user-behavior');
    if (saved) {
      this.userBehavior = JSON.parse(saved);
    }
  }

  /**
   * Reset user behavior
   */
  resetUserBehavior(): void {
    this.userBehavior = {};
    localStorage.removeItem('chart-builder-user-behavior');
  }
}
