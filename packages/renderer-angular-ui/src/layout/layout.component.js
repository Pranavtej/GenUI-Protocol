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
 * GuipFlex: Headless flexbox layout component
 * Behavior: Flex container with configurable direction/alignment
 * Styling: CSS custom properties and inline styles
 */
let GuipFlex = (() => {
    let _classDecorators = [Component({
            selector: 'guip-flex',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="guip-flex" [style.gap]="gap" [style.justifyContent]="justifyContent" [style.alignItems]="alignItems">
      <ng-content></ng-content>
    </div>
  `,
            styles: [`
    .guip-flex {
      display: flex;
      flex-direction: row;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _gap_decorators;
    let _gap_initializers = [];
    let _gap_extraInitializers = [];
    let _justifyContent_decorators;
    let _justifyContent_initializers = [];
    let _justifyContent_extraInitializers = [];
    let _alignItems_decorators;
    let _alignItems_initializers = [];
    let _alignItems_extraInitializers = [];
    let _wrap_decorators;
    let _wrap_initializers = [];
    let _wrap_extraInitializers = [];
    var GuipFlex = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _gap_decorators = [Input()];
            _justifyContent_decorators = [Input()];
            _alignItems_decorators = [Input()];
            _wrap_decorators = [Input()];
            __esDecorate(null, null, _gap_decorators, { kind: "field", name: "gap", static: false, private: false, access: { has: obj => "gap" in obj, get: obj => obj.gap, set: (obj, value) => { obj.gap = value; } }, metadata: _metadata }, _gap_initializers, _gap_extraInitializers);
            __esDecorate(null, null, _justifyContent_decorators, { kind: "field", name: "justifyContent", static: false, private: false, access: { has: obj => "justifyContent" in obj, get: obj => obj.justifyContent, set: (obj, value) => { obj.justifyContent = value; } }, metadata: _metadata }, _justifyContent_initializers, _justifyContent_extraInitializers);
            __esDecorate(null, null, _alignItems_decorators, { kind: "field", name: "alignItems", static: false, private: false, access: { has: obj => "alignItems" in obj, get: obj => obj.alignItems, set: (obj, value) => { obj.alignItems = value; } }, metadata: _metadata }, _alignItems_initializers, _alignItems_extraInitializers);
            __esDecorate(null, null, _wrap_decorators, { kind: "field", name: "wrap", static: false, private: false, access: { has: obj => "wrap" in obj, get: obj => obj.wrap, set: (obj, value) => { obj.wrap = value; } }, metadata: _metadata }, _wrap_initializers, _wrap_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipFlex = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        gap = __runInitializers(this, _gap_initializers, 'var(--guip-spacing-md, 16px)');
        justifyContent = (__runInitializers(this, _gap_extraInitializers), __runInitializers(this, _justifyContent_initializers, 'flex-start'));
        alignItems = (__runInitializers(this, _justifyContent_extraInitializers), __runInitializers(this, _alignItems_initializers, 'stretch'));
        wrap = (__runInitializers(this, _alignItems_extraInitializers), __runInitializers(this, _wrap_initializers, false));
        constructor() {
            __runInitializers(this, _wrap_extraInitializers);
        }
    };
    return GuipFlex = _classThis;
})();
export { GuipFlex };
/**
 * GuipStack: Headless vertical stack (flex column)
 * Behavior: Vertical flex container
 * Styling: CSS custom properties
 */
let GuipStack = (() => {
    let _classDecorators = [Component({
            selector: 'guip-stack',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="guip-stack" [style.gap]="gap">
      <ng-content></ng-content>
    </div>
  `,
            styles: [`
    .guip-stack {
      display: flex;
      flex-direction: column;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _gap_decorators;
    let _gap_initializers = [];
    let _gap_extraInitializers = [];
    var GuipStack = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _gap_decorators = [Input()];
            __esDecorate(null, null, _gap_decorators, { kind: "field", name: "gap", static: false, private: false, access: { has: obj => "gap" in obj, get: obj => obj.gap, set: (obj, value) => { obj.gap = value; } }, metadata: _metadata }, _gap_initializers, _gap_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipStack = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        gap = __runInitializers(this, _gap_initializers, 'var(--guip-spacing-md, 16px)');
        constructor() {
            __runInitializers(this, _gap_extraInitializers);
        }
    };
    return GuipStack = _classThis;
})();
export { GuipStack };
/**
 * GuipGrid: Headless grid layout component
 * Behavior: CSS Grid container
 * Styling: Configurable columns
 */
let GuipGrid = (() => {
    let _classDecorators = [Component({
            selector: 'guip-grid',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="guip-grid" [style.gridTemplateColumns]="templateColumns" [style.gap]="gap">
      <ng-content></ng-content>
    </div>
  `,
            styles: [`
    .guip-grid {
      display: grid;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _columns_decorators;
    let _columns_initializers = [];
    let _columns_extraInitializers = [];
    let _gap_decorators;
    let _gap_initializers = [];
    let _gap_extraInitializers = [];
    var GuipGrid = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _columns_decorators = [Input()];
            _gap_decorators = [Input()];
            __esDecorate(null, null, _columns_decorators, { kind: "field", name: "columns", static: false, private: false, access: { has: obj => "columns" in obj, get: obj => obj.columns, set: (obj, value) => { obj.columns = value; } }, metadata: _metadata }, _columns_initializers, _columns_extraInitializers);
            __esDecorate(null, null, _gap_decorators, { kind: "field", name: "gap", static: false, private: false, access: { has: obj => "gap" in obj, get: obj => obj.gap, set: (obj, value) => { obj.gap = value; } }, metadata: _metadata }, _gap_initializers, _gap_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipGrid = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        columns = __runInitializers(this, _columns_initializers, 1);
        gap = (__runInitializers(this, _columns_extraInitializers), __runInitializers(this, _gap_initializers, 'var(--guip-spacing-md, 16px)'));
        get templateColumns() {
            return `repeat(${this.columns}, 1fr)`;
        }
        constructor() {
            __runInitializers(this, _gap_extraInitializers);
        }
    };
    return GuipGrid = _classThis;
})();
export { GuipGrid };
//# sourceMappingURL=layout.component.js.map