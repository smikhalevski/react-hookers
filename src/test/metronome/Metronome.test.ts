import {Metronome} from '../../main';
import * as sleep from 'sleep-promise';

describe('Metronome', () => {

  test('invokes a callback after an interval', async () => {
    const metronome = new Metronome(20);
    const cbMock = jest.fn();

    const cancel = metronome.schedule(cbMock);

    await sleep(200);

    cancel();

    expect(cbMock.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  test('stops invoking a callback after it was canceled', async () => {
    const metronome = new Metronome(20);
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();

    const cancel1 = metronome.schedule(cbMock1);
    const cancel2 = metronome.schedule(cbMock2);

    await sleep(200);

    cancel1();

    await sleep(200);

    cancel2();

    expect(cbMock1.mock.calls.length).toBeLessThanOrEqual(10);
    expect(cbMock2.mock.calls.length).toBeGreaterThanOrEqual(16);
  });
});
