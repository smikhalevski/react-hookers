import { expect, test } from 'vitest';
import { mergeProps } from '../../main/index.js';

test('merges style objects', () => {
  expect(mergeProps({ style: { '--aaa': 111 } }, { style: { '--bbb': 222 } })).toStrictEqual({
    style: { '--aaa': 111, '--bbb': 222 },
  });
});
