import {MetronomeProvider} from '../../main';

describe('MetronomeProvider', () => {

  test('returns cached metronome', () => {
    const provider = new MetronomeProvider();

    expect(provider.getMetronome(100)).toBe(provider.getMetronome(100));
  });
});
