import { MetronomeProvider } from '../../main';

describe('MetronomeProvider', () => {
  test('returns cached metronome', () => {
    const provider = new MetronomeProvider();

    expect(provider.createMetronome(100)).toBe(provider.createMetronome(100));
  });
});
