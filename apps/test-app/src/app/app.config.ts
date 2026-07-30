import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideGuipRenderer } from '@ainative-ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideGuipRenderer()
  ]
};
