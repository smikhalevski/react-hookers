import { createSelection } from '../main';

describe('createSelection', () => {
  test('creates an empty selection', () => {
    expect(createSelection().size).toBe(0);
  });

  test('limits selection size', () => {
    const selection = createSelection(2);

    selection.add('aaa');
    selection.add('bbb');

    expect(selection.size).toBe(2);
    expect(Array.from(selection)).toEqual(['aaa', 'bbb']);

    selection.add('ccc');

    expect(selection.size).toBe(2);
    expect(Array.from(selection)).toEqual(['aaa', 'ccc']);
  });

  test('deletes an item', () => {
    const selection = createSelection(2);

    selection.add('aaa');
    selection.add('bbb');

    expect(selection.delete('ccc')).toBe(false);
    expect(selection.delete('aaa')).toBe(true);

    expect(selection.size).toBe(1);
    expect(Array.from(selection)).toEqual(['bbb']);
  });

  test('notifies subscribers', () => {
    const listenerMock = jest.fn();
    const selection = createSelection(2);

    selection.subscribe(listenerMock);

    selection.add('aaa');

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });
});
