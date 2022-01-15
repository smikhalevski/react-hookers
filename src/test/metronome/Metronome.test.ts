import {Metronome} from '../../main';
import * as sleep from 'sleep-promise';

describe('Metronome', () => {

  test('invokes a callback after an interval', async () => {
    const metronome = new Metronome(50);
    const cbMock = jest.fn();

    metronome.add(cbMock);

    await sleep(200);

    expect(cbMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('aborts an interval', async () => {
    const metronome = new Metronome(50);
    const cbMock = jest.fn();

    metronome.add(cbMock);

    await sleep(200);

    metronome.remove(cbMock);

    await sleep(200);

    expect(cbMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
