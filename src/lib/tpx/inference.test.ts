import { describe, expect, it } from 'vitest';
import { pickVisionModel, type ModelInfo } from './inference';

const models: ModelInfo[] = [
  { id: 'llama-3.1-8b', description: 'Meta, quick and cheap' },
  { id: 'mistral-small-24b', description: 'Mistral, vision + text' },
  { id: 'kimi-k2.7-code', description: 'Moonshot AI, tools + vision' },
];

describe('pickVisionModel', () => {
  it('prefers a model whose description advertises vision', () => {
    expect(pickVisionModel(models)).toBe('mistral-small-24b');
  });

  it('respects a grant model restriction', () => {
    expect(pickVisionModel(models, ['llama-3.1-8b', 'kimi-k2.7-code'])).toBe('kimi-k2.7-code');
  });

  it('falls back to the first model when none advertise vision', () => {
    const textOnly: ModelInfo[] = [
      { id: 'a', description: 'text only' },
      { id: 'b', description: 'also text' },
    ];
    expect(pickVisionModel(textOnly)).toBe('a');
  });

  it('throws when the restriction leaves no models', () => {
    expect(() => pickVisionModel(models, ['nonexistent'])).toThrow();
  });
});
