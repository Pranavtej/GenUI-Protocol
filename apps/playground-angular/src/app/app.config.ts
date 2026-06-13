import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideGuipRenderer, provideGuipTheme } from '@ainative-ui/renderer-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideGuipRenderer(),
    provideGuipTheme()
  ]
};
