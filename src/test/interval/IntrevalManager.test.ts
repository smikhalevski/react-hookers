import {IntervalManager} from '../../main';
import * as sleep from 'sleep-promise';

describe('IntervalManager', () => {

  test('schedules an interval', async () => {
    const intervalManager = new IntervalManager();
    const listenerMock = jest.fn();

    const abortInterval = intervalManager.scheduleInterval(50, listenerMock);

    await sleep(200);
    abortInterval();

    expect(listenerMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('aborts an interval', async () => {
    const intervalManager = new IntervalManager();
    const listenerMock = jest.fn();

    const abortInterval = intervalManager.scheduleInterval(50, listenerMock);

    await sleep(200);
    abortInterval();
    await sleep(200);

    expect(listenerMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
