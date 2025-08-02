import { callOrGet } from './lang.js';

const { floor } = Math;
const { isSafeInteger } = Number;

const BLOCK_LENGTH = Math.ceil(Math.pow(Number.MAX_SAFE_INTEGER, 1 / 3));

const SQ_BLOCK_LENGTH = BLOCK_LENGTH * BLOCK_LENGTH;

interface Block<T> {
  [index: number]: T;
  [index: string]: T;
}

/**
 * A mutable array that can store up to 2&#8309;&#8308;&#8239;-&#8239;2 elements.
 *
 * Indices should be in range
 * [[Number.MIN_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER),
 * [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)].
 *
 * @example
 * const array = new BigArray<string>();
 *
 * array.push('hello');
 *
 * for (let i = array.startIndex; i < array.endIndex; ++i) {
 *   const value = array.get(i);
 * }
 *
 * @template T A value stored in an array.
 * @group Other
 */
export class BigArray<T> {
  private _negativeBlocks: Block<Block<Block<T>>> = {};
  private _positiveBlocks: Block<Block<Block<T>>> = {};

  /**
   * @param source The iterable to convert.
   * @param baseIndex The index of the first element from iterable.
   */
  constructor(source?: Iterable<T>, baseIndex = 0) {
    if (source !== undefined) {
      for (const value of source) {
        this.set(baseIndex++, value);
      }
    }
  }

  /**
   * An index of the first element in an array, inclusive.
   */
  startIndex = 0;

  /**
   * An index of the last element in an array, exclusive.
   */
  endIndex = 0;

  /**
   * The total number of negative indexes in the array.
   */
  negativeCount = 0;

  /**
   * The total number of positive indexes in the array.
   */
  positiveCount = 0;

  /**
   * Returns an element stored at an index or `undefined`.
   *
   * @param index An integer index of an element.
   */
  get(index: number): T | undefined {
    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const index0 = floor(index / SQ_BLOCK_LENGTH);
    const index1 = floor((index - index0 * SQ_BLOCK_LENGTH) / BLOCK_LENGTH);

    const block0 = blocks[index0];

    if (block0 === undefined) {
      return undefined;
    }

    const block1 = block0[index1];

    if (block1 === undefined) {
      return undefined;
    }

    return block1[index - index0 * SQ_BLOCK_LENGTH - index1 * BLOCK_LENGTH];
  }

  /**
   * Returns an element stored at an index or uses `lazyValue` to produce an element.
   *
   * @param index An integer index of an element.
   * @param lazyValue A value or a callback that returns a value for an index.
   * @returns A value stored at an index.
   */
  getOrSet(index: number, lazyValue: T | ((index: number) => T)): T {
    if (!isSafeInteger(index)) {
      throw new RangeError('Index out of bounds');
    }

    const { startIndex, endIndex } = this;

    if (startIndex === endIndex) {
      this.startIndex = index;
      this.endIndex = index + 1;
    } else if (index >= endIndex) {
      this.endIndex = index + 1;
    } else if (index < startIndex) {
      this.startIndex = index;
    }

    let i = index;

    const blocks = i >= 0 ? this._positiveBlocks : ((i = -i - 1), this._negativeBlocks);

    const index0 = floor(i / SQ_BLOCK_LENGTH);
    const index1 = floor((i - index0 * SQ_BLOCK_LENGTH) / BLOCK_LENGTH);

    const block0 = (blocks[index0] ||= {});
    const block1 = (block0[index1] ||= {});

    const valueIndex = i - index0 * SQ_BLOCK_LENGTH - index1 * BLOCK_LENGTH;

    if (valueIndex in block1) {
      return block1[valueIndex];
    }

    if (index >= 0) {
      this.positiveCount++;
    } else {
      this.negativeCount++;
    }

    return (block1[valueIndex] = callOrGet(lazyValue, index));
  }

  /**
   * Sets an element at an index.
   *
   * @param index An integer index of an element.
   * @param value A value to set.
   */
  set(index: number, value: T): this {
    if (!isSafeInteger(index)) {
      throw new RangeError('Index out of bounds');
    }

    const { startIndex, endIndex } = this;

    if (startIndex === endIndex) {
      this.startIndex = index;
      this.endIndex = index + 1;
    } else if (index >= endIndex) {
      this.endIndex = index + 1;
    } else if (index < startIndex) {
      this.startIndex = index;
    }

    let i = index;

    const blocks = i >= 0 ? this._positiveBlocks : ((i = -i - 1), this._negativeBlocks);

    const index0 = floor(i / SQ_BLOCK_LENGTH);
    const index1 = floor((i - index0 * SQ_BLOCK_LENGTH) / BLOCK_LENGTH);

    const block0 = (blocks[index0] ||= {});
    const block1 = (block0[index1] ||= {});

    const valueIndex = i - index0 * SQ_BLOCK_LENGTH - index1 * BLOCK_LENGTH;

    if (valueIndex in block1) {
      block1[valueIndex] = value;
      return this;
    }

    if (index >= 0) {
      this.positiveCount++;
    } else {
      this.negativeCount++;
    }

    block1[valueIndex] = value;
    return this;
  }

  /**
   * Returns `true` if an array contains an element with the index.
   *
   * @param index An integer index of an element.
   */
  has(index: number): boolean {
    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const index0 = floor(index / SQ_BLOCK_LENGTH);
    const index1 = floor((index - index0 * SQ_BLOCK_LENGTH) / BLOCK_LENGTH);

    const block0 = blocks[index0];

    if (block0 === undefined) {
      return false;
    }

    const block1 = block0[index1];

    if (block1 === undefined) {
      return false;
    }

    return index - index0 * SQ_BLOCK_LENGTH - index1 * BLOCK_LENGTH in block1;
  }

  /**
   * Appends an element to an array after the {@link endIndex}.
   *
   * @param value A value to append.
   */
  push(value: T): this {
    this.set(this.endIndex, value);
    return this;
  }

  /**
   * Prepends an element to an array before the {@link startIndex}.
   *
   * @param value A value to prepend.
   */
  unshift(value: T): this {
    this.set(this.startIndex - 1, value);
    return this;
  }

  /**
   * Returns a new iterator object that contains indexes of {@link has existing elements}.
   */
  *indexes(): IterableIterator<number> {
    const { _negativeBlocks, _positiveBlocks } = this;

    if (this.negativeCount !== 0) {
      for (const blockKey0 of Object.keys(_negativeBlocks).reverse()) {
        const offset0 = +blockKey0 * SQ_BLOCK_LENGTH;

        for (const blockKey1 of Object.keys(_negativeBlocks[blockKey0]).reverse()) {
          const offset = offset0 + +blockKey1 * BLOCK_LENGTH;

          for (const valueKey of Object.keys(_negativeBlocks[blockKey0][blockKey1]).reverse()) {
            yield -(offset + +valueKey) - 1;
          }
        }
      }
    }

    if (this.positiveCount !== 0) {
      for (const blockKey0 in _positiveBlocks) {
        const offset0 = +blockKey0 * SQ_BLOCK_LENGTH;

        for (const blockKey1 in _positiveBlocks[blockKey0]) {
          const offset = offset0 + +blockKey1 * BLOCK_LENGTH;

          for (const valueKey in _positiveBlocks[blockKey0][blockKey1]) {
            yield offset + +valueKey;
          }
        }
      }
    }
  }

  /**
   * Returns a new iterator object that contains existing values.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    const { _negativeBlocks, _positiveBlocks } = this;

    if (this.negativeCount !== 0) {
      for (const blockKey0 of Object.keys(_negativeBlocks).reverse()) {
        for (const blockKey1 of Object.keys(_positiveBlocks[blockKey0]).reverse()) {
          yield* Object.values(_positiveBlocks[blockKey0][blockKey1]).reverse();
        }
      }
    }

    if (this.positiveCount !== 0) {
      for (const blockKey0 in _positiveBlocks) {
        for (const blockKey1 in _positiveBlocks[blockKey0]) {
          const block1 = _positiveBlocks[blockKey0][blockKey1];

          for (const valueKey in block1) {
            yield block1[valueKey];
          }
        }
      }
    }
  }
}
