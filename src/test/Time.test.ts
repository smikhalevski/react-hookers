import { Time } from '../main';

const dateSpy = jest.spyOn(Date, 'now');

beforeEach(() => {
  dateSpy.mockImplementation(() => 111111);
});

describe('Time', () => {
  test('returns current timestamp without an offset', () => {
    const time = new Time();

    expect(time.now()).toBe(Date.now());
  });

  test('returns the timestamp with an offset', () => {
    const time = new Time();

    time.setTimestamp(222222);

    expect(time.now()).toBe(222222);

    dateSpy.mockImplementation(() => 111112);

    expect(time.now()).toBe(222223);
  });
});
