import {Lock} from '../../main';

describe('Lock', () => {

  it('new lock is unlocked', () => {
    const lock = new Lock();

    expect(lock.locked).toBe(false);
  });

  it('acquiring lock returns Promise', () => {
    const lock = new Lock();

    expect(lock.acquire()).toBeInstanceOf(Promise);
  });

  it('provides exclusive lock ownership', (done) => {
    const lock = new Lock();

    let flag = false;

    lock.acquire().then(async (release) => {
      await Promise.resolve();
      flag = true;
      release();
    });

    lock.acquire().then((release) => {
      release();
      expect(flag).toBe(true);
      done();
    });
  });

  it('locked is true if lock is locked', async () => {
    const lock = new Lock();

    const lock1 = lock.acquire();
    const lock2 = lock.acquire();

    expect(lock.locked).toBe(true);

    const release1 = await lock1;
    expect(lock.locked).toBe(true);

    release1();
    expect(lock.locked).toBe(true);

    const release2 = await lock2;
    expect(lock.locked).toBe(true);

    release2();
    expect(lock.locked).toBe(false);
  });
});
