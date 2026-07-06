import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDisableAutocomplete], input:not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, form',
  standalone: true
})
export class DisableAutocompleteDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'form') {
      this.renderer.setAttribute(element, 'autocomplete', 'off');
    } else if (tagName === 'input' || tagName === 'textarea') {
      const type = element.getAttribute('type');
      if (type === 'password') {
        this.renderer.setAttribute(element, 'autocomplete', 'new-password');
      } else {
        this.renderer.setAttribute(element, 'autocomplete', 'off');
      }
      this.renderer.setAttribute(element, 'spellcheck', 'false');
      this.renderer.setAttribute(element, 'autocorrect', 'off');
      this.renderer.setAttribute(element, 'autocapitalize', 'off');
    }
  }
}
