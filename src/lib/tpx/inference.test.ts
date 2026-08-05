import { describe, expect, it } from 'vitest';
import { supportsVision, type ModelInfo } from './inference';

const models: ModelInfo[] = [
  { id: 'llama-3.1-8b', description: 'Meta, quick and cheap' },
  { id: 'mistral-small-24b', description: 'Mistral, vision + text' },
  { id: 'kimi-k2.7-code', description: 'Moonshot AI, tools + vision' },
];

describe('supportsVision', () => {
  it('is true when the description mentions vision', () => {
    expect(supportsVision(models[1])).toBe(true);
    expect(supportsVision(models[2])).toBe(true);
  });

  it('is false when the description does not mention vision', () => {
    expect(supportsVision(models[0])).toBe(false);
  });

  it('is false when there is no description', () => {
    expect(supportsVision({ id: 'x' })).toBe(false);
  });
});
