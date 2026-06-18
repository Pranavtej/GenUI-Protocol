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
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
let GuipKpi = (() => {
    let _classDecorators = [Component({
            selector: 'guip-kpi',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div class="flex flex-row items-center justify-between space-y-0 pb-2">
        <p class="text-sm font-medium text-muted-foreground">{{ label }}</p>
        @if (trend) {
          <guip-badge [variant]="trend === 'up' ? 'success' : trend === 'down' ? 'destructive' : 'secondary'">
            {{ trendValue }}
          </guip-badge>
        }
      </div>
      <div class="text-3xl font-bold">{{ value }}</div>
      @if (subtext) {
        <p class="text-xs text-muted-foreground mt-1">{{ subtext }}</p>
      }
    </div>
  `,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _label_decorators;
    let _label_initializers = [];
    let _label_extraInitializers = [];
    let _value_decorators;
    let _value_initializers = [];
    let _value_extraInitializers = [];
    let _subtext_decorators;
    let _subtext_initializers = [];
    let _subtext_extraInitializers = [];
    let _trend_decorators;
    let _trend_initializers = [];
    let _trend_extraInitializers = [];
    let _trendValue_decorators;
    let _trendValue_initializers = [];
    let _trendValue_extraInitializers = [];
    let _class_decorators;
    let _class_initializers = [];
    let _class_extraInitializers = [];
    var GuipKpi = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _label_decorators = [Input()];
            _value_decorators = [Input()];
            _subtext_decorators = [Input()];
            _trend_decorators = [Input()];
            _trendValue_decorators = [Input()];
            _class_decorators = [Input()];
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value, set: (obj, value) => { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
            __esDecorate(null, null, _subtext_decorators, { kind: "field", name: "subtext", static: false, private: false, access: { has: obj => "subtext" in obj, get: obj => obj.subtext, set: (obj, value) => { obj.subtext = value; } }, metadata: _metadata }, _subtext_initializers, _subtext_extraInitializers);
            __esDecorate(null, null, _trend_decorators, { kind: "field", name: "trend", static: false, private: false, access: { has: obj => "trend" in obj, get: obj => obj.trend, set: (obj, value) => { obj.trend = value; } }, metadata: _metadata }, _trend_initializers, _trend_extraInitializers);
            __esDecorate(null, null, _trendValue_decorators, { kind: "field", name: "trendValue", static: false, private: false, access: { has: obj => "trendValue" in obj, get: obj => obj.trendValue, set: (obj, value) => { obj.trendValue = value; } }, metadata: _metadata }, _trendValue_initializers, _trendValue_extraInitializers);
            __esDecorate(null, null, _class_decorators, { kind: "field", name: "class", static: false, private: false, access: { has: obj => "class" in obj, get: obj => obj.class, set: (obj, value) => { obj.class = value; } }, metadata: _metadata }, _class_initializers, _class_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipKpi = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        label = __runInitializers(this, _label_initializers, '');
        value = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _value_initializers, ''));
        subtext = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _subtext_initializers, ''));
        trend = (__runInitializers(this, _subtext_extraInitializers), __runInitializers(this, _trend_initializers, ''));
        trendValue = (__runInitializers(this, _trend_extraInitializers), __runInitializers(this, _trendValue_initializers, ''));
        class = (__runInitializers(this, _trendValue_extraInitializers), __runInitializers(this, _class_initializers, ''));
        constructor() {
            __runInitializers(this, _class_extraInitializers);
        }
    };
    return GuipKpi = _classThis;
})();
export { GuipKpi };
//# sourceMappingURL=kpi-card.component.js.map