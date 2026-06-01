import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideGuipRenderer } from '@ainative-ui/renderer-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideGuipRenderer()
  ]
};
