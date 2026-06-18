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
import { Component, Input, Output, EventEmitter, ViewEncapsulation, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';
let GuipTabs = (() => {
    let _classDecorators = [Component({
            selector: 'guip-tabs',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="w-full">
      <div class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.value"
            [class]="tabClass(tab.value)"
            (click)="selectTab(tab.value)"
          >
            @if (tab.icon) {
              <span class="mr-2 h-4 w-4 inline-block">{{ tab.icon }}</span>
            }
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="mt-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _tabs_decorators;
    let _tabs_initializers = [];
    let _tabs_extraInitializers = [];
    let _active_decorators;
    let _active_initializers = [];
    let _active_extraInitializers = [];
    let _onTabChange_decorators;
    let _onTabChange_initializers = [];
    let _onTabChange_extraInitializers = [];
    var GuipTabs = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tabs_decorators = [Input()];
            _active_decorators = [Input()];
            _onTabChange_decorators = [Output()];
            __esDecorate(null, null, _tabs_decorators, { kind: "field", name: "tabs", static: false, private: false, access: { has: obj => "tabs" in obj, get: obj => obj.tabs, set: (obj, value) => { obj.tabs = value; } }, metadata: _metadata }, _tabs_initializers, _tabs_extraInitializers);
            __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: obj => "active" in obj, get: obj => obj.active, set: (obj, value) => { obj.active = value; } }, metadata: _metadata }, _active_initializers, _active_extraInitializers);
            __esDecorate(null, null, _onTabChange_decorators, { kind: "field", name: "onTabChange", static: false, private: false, access: { has: obj => "onTabChange" in obj, get: obj => obj.onTabChange, set: (obj, value) => { obj.onTabChange = value; } }, metadata: _metadata }, _onTabChange_initializers, _onTabChange_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipTabs = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        tabs = __runInitializers(this, _tabs_initializers, []);
        active = (__runInitializers(this, _tabs_extraInitializers), __runInitializers(this, _active_initializers, ''));
        onTabChange = (__runInitializers(this, _active_extraInitializers), __runInitializers(this, _onTabChange_initializers, new EventEmitter()));
        activeTab = (__runInitializers(this, _onTabChange_extraInitializers), computed(() => this.active));
        selectTab(value) {
            this.onTabChange.emit(value);
        }
        tabClass(value) {
            return cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', value === this.activeTab()
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:text-foreground');
        }
    };
    return GuipTabs = _classThis;
})();
export { GuipTabs };
let GuipTabPanel = (() => {
    let _classDecorators = [Component({
            selector: 'guip-tab-panel',
            standalone: true,
            imports: [CommonModule],
            template: `
    @if (active) {
      <div role="tabpanel" class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <ng-content></ng-content>
      </div>
    }
  `,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _active_decorators;
    let _active_initializers = [];
    let _active_extraInitializers = [];
    var GuipTabPanel = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _active_decorators = [Input()];
            __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: obj => "active" in obj, get: obj => obj.active, set: (obj, value) => { obj.active = value; } }, metadata: _metadata }, _active_initializers, _active_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipTabPanel = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        active = __runInitializers(this, _active_initializers, false);
        constructor() {
            __runInitializers(this, _active_extraInitializers);
        }
    };
    return GuipTabPanel = _classThis;
})();
export { GuipTabPanel };
//# sourceMappingURL=tabs.component.js.map