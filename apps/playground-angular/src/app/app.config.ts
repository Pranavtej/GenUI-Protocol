import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideGenUiRenderer, provideGenUiTheme } from '@genui-protocol/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideGenUiRenderer(),
    provideGenUiTheme()
  ]
};
