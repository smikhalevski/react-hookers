import { Metronome } from './Metronome';

export class MetronomeProvider {
  private _metronomes: Record<number, Metronome> = {};

  /**
   * Returns a {@link Metronome} instance that uses the given delay.
   *
   * @param ms The number of milliseconds between calls.
   * @returns The {@link Metronome} instance.
   */
  getOrCreateMetronome(ms: number): Metronome {
    return (this._metronomes[ms] ||= new Metronome(ms));
  }
}
