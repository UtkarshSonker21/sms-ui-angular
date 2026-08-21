import { Directive, Input, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { ValidationPatterns } from '../../core/constants/validation-patterns';

@Directive({
  selector: '[appPhoneValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneValidatorDirective),
      multi: true
    }
  ],
  standalone: true
})
export class PhoneValidatorDirective implements Validator, OnChanges {
  @Input('appPhoneValidator') isdCode = '';
  @Input() phoneCodeModel?: any;
  
  private onChange?: () => void;

  registerOnValidatorChange(fn: () => void): void {
    this.onChange = fn;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isdCode'] || changes['phoneCodeModel']) && this.onChange) {
      this.onChange();
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const localNo = control.value;
    const isd = this.isdCode || '';
    const phoneCodeCtrl = this.phoneCodeModel?.control;

    setTimeout(() => {
      if (localNo && !isd) {
        if (phoneCodeCtrl) {
          phoneCodeCtrl.setErrors({ ...phoneCodeCtrl.errors, required: true });
          phoneCodeCtrl.markAsTouched();
        }
      } else {
        if (phoneCodeCtrl && phoneCodeCtrl.errors?.['required']) {
          const errors = { ...phoneCodeCtrl.errors };
          delete errors['required'];
          phoneCodeCtrl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }

      if (isd && !localNo) {
        control.markAsTouched();
      }
    });

    if (isd && !localNo) {
      return { required: true };
    }

    if (localNo && isd) {
      const localNoStr = String(localNo);
      if (!/^\d+$/.test(localNoStr)) {
        return { pattern: true };
      }
      const prefix = isd.startsWith('+') ? isd : '+' + isd;
      const fullPhone = `${prefix}${localNoStr}`;
      const isValid = ValidationPatterns.phone.test(fullPhone);
      return isValid ? null : { pattern: true };
    }

    if (localNo && !isd) {
      return { isdMissing: true };
    }

    return null;
  }
}
