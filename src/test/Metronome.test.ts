import { Metronome } from '../main';

jest.useFakeTimers();

describe('Metronome', () => {
  test('pauses the metronome', () => {
    const metronome = new Metronome(20);

    expect(metronome.isPaused).toBe(false);

    metronome.pause();

    expect(metronome.isPaused).toBe(true);
  });

  test('paused metronome does not invoke callbacks', () => {
    const metronome = new Metronome(20);
    const cbMock = jest.fn();

    metronome.pause();
    metronome.schedule(cbMock);

    jest.runOnlyPendingTimers();

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('stars the metronome', () => {
    const metronome = new Metronome(20);
    const cbMock = jest.fn();

    metronome.pause();
    const cancel = metronome.schedule(cbMock);
    metronome.start();

    jest.advanceTimersByTime(80);

    cancel();

    expect(cbMock.mock.calls.length).toBe(4);
  });

  test('invokes a callback after an interval', () => {
    const metronome = new Metronome(20);
    const cbMock = jest.fn();

    const cancel = metronome.schedule(cbMock);

    jest.advanceTimersByTime(80);

    cancel();

    expect(cbMock.mock.calls.length).toBe(4);
  });

  test('stops invoking a callback after it was canceled', () => {
    const metronome = new Metronome(20);
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();

    const cancel1 = metronome.schedule(cbMock1);
    const cancel2 = metronome.schedule(cbMock2);

    jest.advanceTimersByTime(80);

    cancel1();

    jest.advanceTimersByTime(80);

    cancel2();

    expect(cbMock1.mock.calls.length).toBe(4);
    expect(cbMock2.mock.calls.length).toBe(8);
  });
});
