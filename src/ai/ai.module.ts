import { Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai-provider';

@Module({
  providers: [
    {
      provide: 'GEMINI_PROVIDER',
      useClass: GeminiProvider,
    },
    {
      provide: 'OPENAI_PROVIDER',
      useClass: OpenAiProvider,
    },
  ],
  exports: ['GEMINI_PROVIDER', 'OPENAI_PROVIDER'],
})
export class AiModule {}
