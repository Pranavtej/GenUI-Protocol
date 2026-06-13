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
import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
let GuipCheckbox = (() => {
    let _classDecorators = [Component({
            selector: 'guip-checkbox',
            standalone: true,
            imports: [CommonModule],
            template: `
    <label class="flex items-center gap-2 cursor-pointer group" [class.opacity-50]="disabled">
      <div class="relative flex items-center justify-center">
        <input
          [id]="id"
          type="checkbox"
          [checked]="checked"
          [disabled]="disabled"
          [required]="required"
          [class]="cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary border-primary' : 'bg-background',
            color && 'bg-' + color
          )"
          (change)="onCheckboxChange($event)"
          (blur)="onTouched()"
        />
        @if (checked) {
          <svg class="absolute h-3 w-3 text-primary-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        }
      </div>
      @if (label) {
        <span class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          {{ label }}
        </span>
      }
      <ng-content></ng-content>
    </label>
  `,
            encapsulation: ViewEncapsulation.None,
            providers: [
                {
                    provide: NG_VALUE_ACCESSOR,
                    useExisting: forwardRef(() => GuipCheckbox),
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
    let _label_decorators;
    let _label_initializers = [];
    let _label_extraInitializers = [];
    let _required_decorators;
    let _required_initializers = [];
    let _required_extraInitializers = [];
    let _disabled_decorators;
    let _disabled_initializers = [];
    let _disabled_extraInitializers = [];
    let _color_decorators;
    let _color_initializers = [];
    let _color_extraInitializers = [];
    var GuipCheckbox = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [Input()];
            _label_decorators = [Input()];
            _required_decorators = [Input()];
            _disabled_decorators = [Input()];
            _color_decorators = [Input()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _required_decorators, { kind: "field", name: "required", static: false, private: false, access: { has: obj => "required" in obj, get: obj => obj.required, set: (obj, value) => { obj.required = value; } }, metadata: _metadata }, _required_initializers, _required_extraInitializers);
            __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
            __esDecorate(null, null, _color_decorators, { kind: "field", name: "color", static: false, private: false, access: { has: obj => "color" in obj, get: obj => obj.color, set: (obj, value) => { obj.color = value; } }, metadata: _metadata }, _color_initializers, _color_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCheckbox = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        id = __runInitializers(this, _id_initializers, `checkbox-${Math.random().toString(36).substr(2, 9)}`);
        label = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _label_initializers, ''));
        required = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _required_initializers, false));
        disabled = (__runInitializers(this, _required_extraInitializers), __runInitializers(this, _disabled_initializers, false));
        color = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _color_initializers, ''));
        checked = (__runInitializers(this, _color_extraInitializers), false);
        onChangeFn = () => { };
        onTouchedFn = () => { };
        onCheckboxChange(event) {
            const target = event.target;
            this.checked = target.checked;
            this.onChangeFn(this.checked);
        }
        onTouched() {
            this.onTouchedFn();
        }
        writeValue(value) {
            this.checked = !!value;
        }
        registerOnChange(fn) {
            this.onChangeFn = fn;
        }
        registerOnTouched(fn) {
            this.onTouchedFn = fn;
        }
        setDisabledState(isDisabled) {
            this.disabled = isDisabled;
        }
    };
    return GuipCheckbox = _classThis;
})();
export { GuipCheckbox };
//# sourceMappingURL=checkbox.component.js.map