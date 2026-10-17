import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideGenUiRenderer } from '@genui-protocol/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideGenUiRenderer()
  ]
};
