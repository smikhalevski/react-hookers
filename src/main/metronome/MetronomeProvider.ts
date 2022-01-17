import {Metronome} from './Metronome';

export class MetronomeProvider {

  public metronomes = new Map<number, Metronome>();

  /**
   * Returns a cached {@link Metronome} instance that uses the given delay.
   *
   * @param ms The number of milliseconds between calls.
   * @returns The {@link Metronome} instance.
   */
  public getMetronome(ms: number): Metronome {
    let metronome = this.metronomes.get(ms);

    if (!metronome) {
      metronome = new Metronome(ms);
      this.metronomes.set(ms, metronome);
    }

    return metronome;
  }
}
