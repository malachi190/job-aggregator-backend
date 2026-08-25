import { Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    {
      provide: 'GEMINI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: ['GEMINI_PROVIDER'],
})
export class AiModule {}
