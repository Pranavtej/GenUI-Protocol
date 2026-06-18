var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Component, Input, forwardRef, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { cn } from '../lib/utils';
let GuipTextarea = (() => {
    let _classDecorators = [Component({
            selector: 'guip-textarea',
            standalone: true,
            imports: [CommonModule, FormsModule],
            template: `
    <div class="w-full">
      @if (label) {
        <guip-label [for]="id" [class]="labelClass">{{ label }}</guip-label>
      }
      <textarea
        [id]="id"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [value]="value"
        [class]="computedClass()"
        [attr.aria-invalid]="error ? 'true' : 'false'"
        [attr.aria-describedby]="error ? id + '-error' : null"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [rows]="rows"
      ></textarea>
      @if (error) {
        <p id="{{ id }}-error" class="text-sm text-destructive mt-1" role="alert">{{ error }}</p>
      }
      @if (hint && !error) {
        <p id="{{ id }}-hint" class="text-sm text-muted-foreground mt-1">{{ hint }}</p>
      }
    </div>
  `,
            encapsulation: ViewEncapsulation.None,
            providers: [
                {
                    provide: NG_VALUE_ACCESSOR,
                    useExisting: forwardRef(() => GuipTextarea),
                    multi: true,
                },
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _placeholder_decorators;
    let _placeholder_initializers = [];
    let _placeholder_extraInitializers = [];
    let _label_decorators;
    let _label_initializers = [];
    let _label_extraInitializers = [];
    let _hint_decorators;
    let _hint_initializers = [];
    let _hint_extraInitializers = [];
    let _error_decorators;
    let _error_initializers = [];
    let _error_extraInitializers = [];
    let _required_decorators;
    let _required_initializers = [];
    let _required_extraInitializers = [];
    let _disabled_decorators;
    let _disabled_initializers = [];
    let _disabled_extraInitializers = [];
    let _rows_decorators;
    let _rows_initializers = [];
    let _rows_extraInitializers = [];
    let _class_decorators;
    let _class_initializers = [];
    let _class_extraInitializers = [];
    let _labelClass_decorators;
    let _labelClass_initializers = [];
    let _labelClass_extraInitializers = [];
    var GuipTextarea = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [Input()];
            _placeholder_decorators = [Input()];
            _label_decorators = [Input()];
            _hint_decorators = [Input()];
            _error_decorators = [Input()];
            _required_decorators = [Input()];
            _disabled_decorators = [Input()];
            _rows_decorators = [Input()];
            _class_decorators = [Input()];
            _labelClass_decorators = [Input()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _placeholder_decorators, { kind: "field", name: "placeholder", static: false, private: false, access: { has: obj => "placeholder" in obj, get: obj => obj.placeholder, set: (obj, value) => { obj.placeholder = value; } }, metadata: _metadata }, _placeholder_initializers, _placeholder_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _hint_decorators, { kind: "field", name: "hint", static: false, private: false, access: { has: obj => "hint" in obj, get: obj => obj.hint, set: (obj, value) => { obj.hint = value; } }, metadata: _metadata }, _hint_initializers, _hint_extraInitializers);
            __esDecorate(null, null, _error_decorators, { kind: "field", name: "error", static: false, private: false, access: { has: obj => "error" in obj, get: obj => obj.error, set: (obj, value) => { obj.error = value; } }, metadata: _metadata }, _error_initializers, _error_extraInitializers);
            __esDecorate(null, null, _required_decorators, { kind: "field", name: "required", static: false, private: false, access: { has: obj => "required" in obj, get: obj => obj.required, set: (obj, value) => { obj.required = value; } }, metadata: _metadata }, _required_initializers, _required_extraInitializers);
            __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
            __esDecorate(null, null, _rows_decorators, { kind: "field", name: "rows", static: false, private: false, access: { has: obj => "rows" in obj, get: obj => obj.rows, set: (obj, value) => { obj.rows = value; } }, metadata: _metadata }, _rows_initializers, _rows_extraInitializers);
            __esDecorate(null, null, _class_decorators, { kind: "field", name: "class", static: false, private: false, access: { has: obj => "class" in obj, get: obj => obj.class, set: (obj, value) => { obj.class = value; } }, metadata: _metadata }, _class_initializers, _class_extraInitializers);
            __esDecorate(null, null, _labelClass_decorators, { kind: "field", name: "labelClass", static: false, private: false, access: { has: obj => "labelClass" in obj, get: obj => obj.labelClass, set: (obj, value) => { obj.labelClass = value; } }, metadata: _metadata }, _labelClass_initializers, _labelClass_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipTextarea = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        id = __runInitializers(this, _id_initializers, `textarea-${Math.random().toString(36).substr(2, 9)}`);
        placeholder = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _placeholder_initializers, ''));
        label = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _label_initializers, ''));
        hint = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _hint_initializers, ''));
        error = (__runInitializers(this, _hint_extraInitializers), __runInitializers(this, _error_initializers, ''));
        required = (__runInitializers(this, _error_extraInitializers), __runInitializers(this, _required_initializers, false));
        disabled = (__runInitializers(this, _required_extraInitializers), __runInitializers(this, _disabled_initializers, false));
        rows = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _rows_initializers, 3));
        class = (__runInitializers(this, _rows_extraInitializers), __runInitializers(this, _class_initializers, ''));
        labelClass = (__runInitializers(this, _class_extraInitializers), __runInitializers(this, _labelClass_initializers, ''));
        value = (__runInitializers(this, _labelClass_extraInitializers), '');
        onChange = () => { };
        onTouched = () => { };
        computedClass = computed(() => cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none', this.error && 'border-destructive focus-visible:ring-destructive', this.class));
        onInput(event) {
            const target = event.target;
            this.value = target.value;
            this.onChange(this.value);
        }
        writeValue(value) {
            this.value = value || '';
        }
        registerOnChange(fn) {
            this.onChange = fn;
        }
        registerOnTouched(fn) {
            this.onTouched = fn;
        }
        setDisabledState(isDisabled) {
            this.disabled = isDisabled;
        }
    };
    return GuipTextarea = _classThis;
})();
export { GuipTextarea };
//# sourceMappingURL=textarea.component.js.map