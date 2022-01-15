import {Metronome} from '../../main';
import * as sleep from 'sleep-promise';

describe('Metronome', () => {

  test('invokes a callback after an interval', async () => {
    const metronome = new Metronome(20);
    const cbMock = jest.fn();

    metronome.add(cbMock);

    await sleep(200);

    expect(cbMock.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  test('stops invoking a callback after it was removed', async () => {
    const metronome = new Metronome(20);
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();

    metronome.add(cbMock1);
    metronome.add(cbMock2);

    await sleep(200);

    metronome.remove(cbMock1);

    await sleep(200);

    expect(cbMock1.mock.calls.length).toBeLessThanOrEqual(10);
    expect(cbMock2.mock.calls.length).toBeGreaterThanOrEqual(16);
  });
});
