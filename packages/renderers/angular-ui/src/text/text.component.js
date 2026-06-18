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
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
/**
 * GuipText: Headless text/span component
 * Behavior: Text content with semantic styling
 * Styling: CSS custom properties
 */
let GuipText = (() => {
    let _classDecorators = [Component({
            selector: 'guip-text',
            standalone: true,
            imports: [CommonModule],
            template: `<span class="guip-text"><ng-content></ng-content></span>`,
            styles: [`
    .guip-text {
      color: var(--guip-text-primary, #fafafa);
      font-size: var(--guip-font-size-base, 14px);
      line-height: 1.5;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _as_decorators;
    let _as_initializers = [];
    let _as_extraInitializers = [];
    var GuipText = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _as_decorators = [Input()];
            __esDecorate(null, null, _as_decorators, { kind: "field", name: "as", static: false, private: false, access: { has: obj => "as" in obj, get: obj => obj.as, set: (obj, value) => { obj.as = value; } }, metadata: _metadata }, _as_initializers, _as_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipText = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        as = __runInitializers(this, _as_initializers, 'span');
        constructor() {
            __runInitializers(this, _as_extraInitializers);
        }
    };
    return GuipText = _classThis;
})();
export { GuipText };
/**
 * GuipHeading: Headless heading component
 * Behavior: Semantic heading with CSS custom properties
 * Styling: CSS custom properties
 */
let GuipHeading = (() => {
    let _classDecorators = [Component({
            selector: 'guip-heading',
            standalone: true,
            imports: [CommonModule],
            template: `
    <h1 *ngIf="level === 1" class="guip-heading"><ng-content></ng-content></h1>
    <h2 *ngIf="level === 2" class="guip-heading"><ng-content></ng-content></h2>
    <h3 *ngIf="level === 3" class="guip-heading"><ng-content></ng-content></h3>
    <h4 *ngIf="level === 4" class="guip-heading"><ng-content></ng-content></h4>
    <h5 *ngIf="level === 5" class="guip-heading"><ng-content></ng-content></h5>
    <h6 *ngIf="level === 6" class="guip-heading"><ng-content></ng-content></h6>
  `,
            styles: [`
    .guip-heading {
      margin: 0;
      color: var(--guip-text-primary, #fafafa);
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1.guip-heading { font-size: var(--guip-font-size-xl, 28px); }
    h2.guip-heading { font-size: var(--guip-font-size-lg, 24px); }
    h3.guip-heading { font-size: var(--guip-font-size-md, 20px); }
    h4.guip-heading { font-size: var(--guip-font-size-base, 18px); }
    h5.guip-heading { font-size: var(--guip-font-size-sm, 16px); }
    h6.guip-heading { font-size: var(--guip-font-size-xs, 14px); }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _level_decorators;
    let _level_initializers = [];
    let _level_extraInitializers = [];
    var GuipHeading = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _level_decorators = [Input()];
            __esDecorate(null, null, _level_decorators, { kind: "field", name: "level", static: false, private: false, access: { has: obj => "level" in obj, get: obj => obj.level, set: (obj, value) => { obj.level = value; } }, metadata: _metadata }, _level_initializers, _level_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipHeading = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        level = __runInitializers(this, _level_initializers, 3);
        constructor() {
            __runInitializers(this, _level_extraInitializers);
        }
    };
    return GuipHeading = _classThis;
})();
export { GuipHeading };
//# sourceMappingURL=text.component.js.map