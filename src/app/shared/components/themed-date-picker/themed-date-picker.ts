import { CommonModule } from '@angular/common';
import { Component, forwardRef, HostListener, Input, ViewChild, ElementRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, Overlay, OverlayModule, ScrollStrategy } from '@angular/cdk/overlay';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-themed-date-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule, MatDatepickerModule],
  templateUrl: './themed-date-picker.html',
  styleUrl: './themed-date-picker.scss',
  providers: [
    ...provideNativeDateAdapter(),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ThemedDatePickerComponent), multi: true },
  ],
})
export class ThemedDatePickerComponent implements ControlValueAccessor {
  private static activePicker: ThemedDatePickerComponent | null = null;
  private readonly overlay = inject(Overlay);
  @Input() inputId = '';
  @Input() ariaLabel = 'Choose date';
  @Input() useInputAsOrigin = false;
  @Input() set disabled(value: boolean) { this.isDisabled = value; }
  @ViewChild('trigger', { read: ElementRef }) private trigger?: ElementRef<HTMLElement>;

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  value: string | null = null;
  selectedDate: Date | null = null;
  today = new Date();
  isOpen = false;
  isDisabled = false;
  panelWidth = 320;
  readonly scrollStrategy: ScrollStrategy = this.overlay.scrollStrategies.reposition({ scrollThrottle: 0 });

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get displayValue(): string {
    if (!this.selectedDate) return '';
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${this.selectedDate.getFullYear()}`;
  }

  writeValue(value: string | null | undefined): void {
    this.value = this.normalizeIso(value);
    this.selectedDate = this.parseIso(this.value);
  }

  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled = disabled; }

  togglePicker(): void {
    if (this.isDisabled) return;
    if (this.isOpen) {
      this.closePicker();
      return;
    }
    if (ThemedDatePickerComponent.activePicker && ThemedDatePickerComponent.activePicker !== this) {
      ThemedDatePickerComponent.activePicker.closePicker();
    }
    ThemedDatePickerComponent.activePicker = this;
    const width = this.trigger?.nativeElement.getBoundingClientRect().width ?? 320;
    this.panelWidth = Math.min(Math.max(width, 300), Math.max(280, document.documentElement.clientWidth - 24));
    this.today = new Date();
    this.isOpen = true;
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closePicker(true);
    } else if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (!this.isOpen) this.togglePicker();
    }
  }

  selectDate(date: Date | null): void {
    if (!date) return;
    this.commit(this.toIso(date));
    this.closePicker(true);
  }

  clearDate(): void {
    this.commit(null);
    this.closePicker(true);
  }

  selectToday(): void {
    const date = new Date();
    this.commit(this.toIso(date));
    this.closePicker(true);
  }

  closePicker(returnFocus = false): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (ThemedDatePickerComponent.activePicker === this) ThemedDatePickerComponent.activePicker = null;
    this.onTouched();
    if (returnFocus) queueMicrotask(() => this.trigger?.nativeElement.focus());
  }

  @HostListener('window:resize') onResize(): void {
    if (this.isOpen) this.closePicker();
  }

  @HostListener('document:keydown.escape') onEscape(): void {
    if (this.isOpen) this.closePicker(true);
  }

  private commit(value: string | null): void {
    this.value = value;
    this.selectedDate = this.parseIso(value);
    this.onChange(value);
  }

  private normalizeIso(value: string | null | undefined): string | null {
    return value && this.parseIso(value) ? value.slice(0, 10) : null;
  }

  private parseIso(value: string | null): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 12);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  private toIso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
