import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelpService, HelpItem } from '../../core/services/help.service';

@Component({
  selector: 'app-help-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-panel.component.html',
  styleUrls: ['./help-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpPanelComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  searchQuery: string = '';
  selectedCategory: string | null = null;
  suggestedTips: HelpItem[] = [];
  filteredItems: HelpItem[] = [];
  allItems: HelpItem[] = [];
  categories: string[] = [];
  viewMode: 'search' | 'categories' | 'tips' = 'tips';

  constructor(private helpService: HelpService) {}

  ngOnInit(): void {
    this.allItems = this.helpService.getHelpItems();
    this.categories = this.helpService.getCategories();
    this.suggestedTips = this.helpService.getSuggestedTips();
    this.filteredItems = this.allItems;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.filteredItems = this.helpService.searchHelp(this.searchQuery);
      this.viewMode = 'search';
    } else {
      this.filteredItems = this.allItems;
      this.viewMode = 'categories';
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filteredItems = this.helpService.getHelpByCategory(category);
    this.viewMode = 'categories';
  }

  clearCategory(): void {
    this.selectedCategory = null;
    this.filteredItems = this.allItems;
  }

  trackInteraction(itemId: string): void {
    this.helpService.trackFeatureInteraction(itemId);
  }

  startTour(): void {
    this.helpService.startTour();
    this.closePanel();
  }

  closePanel(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.filteredItems = this.allItems;
    this.viewMode = 'tips';
  }

  getHelpByCategory(category: string): HelpItem[] {
    return this.helpService.getHelpByCategory(category);
  }
}
