import { MetronomeProvider } from '../main';

describe('MetronomeProvider', () => {
  test('returns cached metronome', () => {
    const provider = new MetronomeProvider();

    expect(provider.getOrCreateMetronome(100)).toBe(provider.getOrCreateMetronome(100));
  });
});
