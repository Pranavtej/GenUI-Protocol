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
import { Component, Input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-primary-foreground',
            secondary: 'border-transparent bg-secondary text-secondary-foreground',
            destructive: 'border-transparent bg-destructive text-destructive-foreground',
            outline: 'text-foreground',
            success: 'border-transparent bg-emerald-500 text-white',
            warning: 'border-transparent bg-amber-500 text-white',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
let GuipBadge = (() => {
    let _classDecorators = [Component({
            selector: 'guip-badge',
            standalone: true,
            imports: [CommonModule],
            template: `<span [class]="computedClass()"><ng-content></ng-content></span>`,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _variant_decorators;
    let _variant_initializers = [];
    let _variant_extraInitializers = [];
    let _class_decorators;
    let _class_initializers = [];
    let _class_extraInitializers = [];
    var GuipBadge = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _variant_decorators = [Input()];
            _class_decorators = [Input()];
            __esDecorate(null, null, _variant_decorators, { kind: "field", name: "variant", static: false, private: false, access: { has: obj => "variant" in obj, get: obj => obj.variant, set: (obj, value) => { obj.variant = value; } }, metadata: _metadata }, _variant_initializers, _variant_extraInitializers);
            __esDecorate(null, null, _class_decorators, { kind: "field", name: "class", static: false, private: false, access: { has: obj => "class" in obj, get: obj => obj.class, set: (obj, value) => { obj.class = value; } }, metadata: _metadata }, _class_initializers, _class_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipBadge = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        variant = __runInitializers(this, _variant_initializers, 'default');
        class = (__runInitializers(this, _variant_extraInitializers), __runInitializers(this, _class_initializers, ''));
        computedClass = (__runInitializers(this, _class_extraInitializers), computed(() => cn(badgeVariants({ variant: this.variant }), this.class)));
    };
    return GuipBadge = _classThis;
})();
export { GuipBadge };
//# sourceMappingURL=badge.component.js.map