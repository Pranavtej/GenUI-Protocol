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
import { cn } from '../lib/utils';
let GuipCard = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div [class]="computedClass()">
      @if (hasHeader()) {
        <div class="flex flex-col space-y-1.5 p-6">
          @if (title) {
            <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
          }
        </div>
      }
      <div class="p-6 pt-0">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="flex items-center p-6 pt-0">
          <ng-content select="[guip-card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _subtitle_decorators;
    let _subtitle_initializers = [];
    let _subtitle_extraInitializers = [];
    let _class_decorators;
    let _class_initializers = [];
    let _class_extraInitializers = [];
    var GuipCard = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [Input()];
            _subtitle_decorators = [Input()];
            _class_decorators = [Input()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _subtitle_decorators, { kind: "field", name: "subtitle", static: false, private: false, access: { has: obj => "subtitle" in obj, get: obj => obj.subtitle, set: (obj, value) => { obj.subtitle = value; } }, metadata: _metadata }, _subtitle_initializers, _subtitle_extraInitializers);
            __esDecorate(null, null, _class_decorators, { kind: "field", name: "class", static: false, private: false, access: { has: obj => "class" in obj, get: obj => obj.class, set: (obj, value) => { obj.class = value; } }, metadata: _metadata }, _class_initializers, _class_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCard = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        title = __runInitializers(this, _title_initializers, '');
        subtitle = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _subtitle_initializers, ''));
        class = (__runInitializers(this, _subtitle_extraInitializers), __runInitializers(this, _class_initializers, ''));
        hasHeader = (__runInitializers(this, _class_extraInitializers), computed(() => !!this.title || !!this.subtitle));
        hasFooter = computed(() => false);
        computedClass = computed(() => cn('rounded-lg border bg-card text-card-foreground shadow-sm', this.class));
    };
    return GuipCard = _classThis;
})();
export { GuipCard };
let GuipCardHeader = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card-header',
            standalone: true,
            imports: [CommonModule],
            template: `
    <div class="flex flex-col space-y-1.5 p-6">
      <ng-content></ng-content>
    </div>
  `,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuipCardHeader = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCardHeader = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GuipCardHeader = _classThis;
})();
export { GuipCardHeader };
let GuipCardTitle = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card-title',
            standalone: true,
            imports: [CommonModule],
            template: `<h3 class="text-2xl font-semibold leading-none tracking-tight"><ng-content></ng-content></h3>`,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuipCardTitle = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCardTitle = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GuipCardTitle = _classThis;
})();
export { GuipCardTitle };
let GuipCardDescription = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card-description',
            standalone: true,
            imports: [CommonModule],
            template: `<p class="text-sm text-muted-foreground"><ng-content></ng-content></p>`,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuipCardDescription = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCardDescription = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GuipCardDescription = _classThis;
})();
export { GuipCardDescription };
let GuipCardContent = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card-content',
            standalone: true,
            imports: [CommonModule],
            template: `<div class="p-6 pt-0"><ng-content></ng-content></div>`,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuipCardContent = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCardContent = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GuipCardContent = _classThis;
})();
export { GuipCardContent };
let GuipCardFooter = (() => {
    let _classDecorators = [Component({
            selector: 'guip-card-footer',
            standalone: true,
            imports: [CommonModule],
            template: `<div class="flex items-center p-6 pt-0"><ng-content></ng-content></div>`,
            encapsulation: ViewEncapsulation.None,
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuipCardFooter = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuipCardFooter = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GuipCardFooter = _classThis;
})();
export { GuipCardFooter };
//# sourceMappingURL=card.component.js.map