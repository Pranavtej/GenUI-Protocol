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
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../lib/utils';
let GuipSwitch = (() => {
    let _classDecorators = [Component({
            selector: 'guip-switch',
            standalone: true,
            imports: [CommonModule],
            template: `
    <label class="inline-flex items-center gap-2 cursor-pointer" [class.opacity-50]="disabled">
      <button
        [id]="id"
        type="button"
        role="switch"
        [attr.aria-checked]="checked"
        [disabled]="disabled"
        [class]="trackClass()"
        (click)="toggle()"
        (keydown.space)="$event.preventDefault(); toggle()"
      >
        <span [class]="thumbClass()">
          <span class="sr-only">{{ label }}</span>
        </span>
      </button>
      @if (label) {
        <span class="text-sm font-medium leading-none">{{ label }}</span>
      }
      <ng-content></ng-content>
    </label>
  `,
            encapsulation: ViewEncapsulation.None,
            providers: [
                {
                    provide: NG_VALUE_ACCESSOR,
                    useExisting: forwardRef(() => GuipSwitch),
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
    let _disabled_decorators;
    let _disabled_initializers = [];
    let _disabled_extraInitializers = [];
    var GuipSwitch = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [Input()];
            _label_decorators = [Input()];
            _disabled_decorators = [Input()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipSwitch = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        id = __runInitializers(this, _id_initializers, `switch-${Math.random().toString(36).substr(2, 9)}`);
        label = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _label_initializers, ''));
        disabled = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _disabled_initializers, false));
        checked = (__runInitializers(this, _disabled_extraInitializers), false);
        onChangeFn = () => { };
        onTouchedFn = () => { };
        trackClass = computed(() => cn('peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background', this.checked ? 'bg-primary' : 'bg-input'));
        thumbClass = computed(() => cn('pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform', this.checked ? 'translate-x-5' : 'translate-x-0'));
        toggle() {
            if (this.disabled)
                return;
            this.checked = !this.checked;
            this.onChangeFn(this.checked);
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
    return GuipSwitch = _classThis;
})();
export { GuipSwitch };
//# sourceMappingURL=switch.component.js.map