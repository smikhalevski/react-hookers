import { callOrGet } from './lang.js';

const { floor } = Math;
const { isSafeInteger } = Number;

const BLOCK_LENGTH = Math.ceil(Math.pow(Number.MAX_SAFE_INTEGER, 1 / 3));

const SQ_BLOCK_LENGTH = BLOCK_LENGTH * BLOCK_LENGTH;

const MAX_ARRAY_LENGTH = 0xffffffff;

interface Block<T> {
  [index: number]: T;
  [index: string]: T;
}

/**
 * A mutable array that can store up to 2&#8309;&#8308;&#8239;-&#8239;2 elements.
 *
 * Indices must be in the range [{@link Number.MIN_SAFE_INTEGER}, {@link Number.MAX_SAFE_INTEGER}].
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
 * @template T The type of values stored in the array.
 * @group Other
 */
export class BigArray<T> {
  private _negativeBlocks: Block<Block<Block<T>>> = {};
  private _positiveBlocks: Block<Block<Block<T>>> = {};

  /**
   * The index of the first element in the array (inclusive).
   */
  startIndex = 0;

  /**
   * The index of the last element in the array (exclusive).
   */
  endIndex = 0;

  /**
   * The total number of negative indices in the array.
   */
  negativeCount = 0;

  /**
   * The total number of non-negative indices in the array.
   */
  positiveCount = 0;

  /**
   * Returns the element stored at `index`, or `undefined` if no element exists at that index.
   *
   * @param index An integer element index.
   */
  get(index: number): T {
    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const index0 = floor(index / SQ_BLOCK_LENGTH);
    const index1 = floor((index - index0 * SQ_BLOCK_LENGTH) / BLOCK_LENGTH);

    const block0 = blocks[index0];

    if (block0 === undefined) {
      return undefined!;
    }

    const block1 = block0[index1];

    if (block1 === undefined) {
      return undefined!;
    }

    return block1[index - index0 * SQ_BLOCK_LENGTH - index1 * BLOCK_LENGTH];
  }

  /**
   * Returns the element stored at `index`, or uses `lazyValue` to produce and store an element.
   *
   * @param index An integer element index.
   * @param lazyValue A value or a callback that returns a value for the given index.
   * @returns The value stored at `index`.
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

    if (index < 0) {
      this.negativeCount++;
    } else {
      this.positiveCount++;
    }

    return (block1[valueIndex] = callOrGet(lazyValue, index));
  }

  /**
   * Sets the element at `index`.
   *
   * @param index An integer element index.
   * @param value The value to store.
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

    if (index < 0) {
      this.negativeCount++;
    } else {
      this.positiveCount++;
    }

    block1[valueIndex] = value;
    return this;
  }

  /**
   * Returns `true` if the array contains an element at `index`.
   *
   * @param index An integer element index.
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
   * Appends an element to the array at {@link endIndex}.
   *
   * @param value The value to append.
   */
  push(value: T): this {
    this.set(this.endIndex, value);
    return this;
  }

  /**
   * Prepends an element to the array before {@link startIndex}.
   *
   * @param value The value to prepend.
   */
  unshift(value: T): this {
    this.set(this.startIndex - 1, value);
    return this;
  }

  /**
   * Copies up to `length` elements from `source` (starting at `sourceStartIndex`) into this array
   * (starting at `startIndex`).
   *
   * @param source The source of elements.
   * @param startIndex The index in this array to start writing at.
   * @param sourceStartIndex The index in the source to start reading at.
   * @param length The maximum number of elements to read from the source.
   */
  copyOver(source: Iterable<T> | ArrayLike<T>, startIndex = 0, sourceStartIndex = 0, length = Infinity): this {
    if ('length' in source) {
      for (let i = sourceStartIndex; i < length && i < source.length; ++i) {
        this.set(startIndex - sourceStartIndex + i, source[i]);
      }

      return this;
    }

    if (source instanceof BigArray) {
      // Copy existing elements

      for (const index of source.indexes()) {
        if (index < sourceStartIndex) {
          continue;
        }
        if (index >= sourceStartIndex + length) {
          break;
        }
        this.set(startIndex - sourceStartIndex + index, source.get(index));
      }

      return this;
    }

    let i = 0;

    for (const value of source) {
      if (i < sourceStartIndex) {
        // Skip leading elements
        ++i;
        continue;
      }
      if (i >= sourceStartIndex + length) {
        // Stop after the required number of elements is consumed
        break;
      }
      this.set(startIndex - sourceStartIndex + i, value);
      ++i;
    }

    return this;
  }

  /**
   * Returns a slice of elements from this array. The slice length will not exceed 2&sup3;&sup2; items.
   *
   * @param startIndex The start index of the slice (inclusive).
   * @param endIndex The end index of the slice (exclusive).
   */
  slice(startIndex = this.startIndex, endIndex = this.endIndex): T[] {
    const values: T[] = [];

    for (let i = startIndex; i < endIndex && values.push(this.get(i)) < MAX_ARRAY_LENGTH; ++i) {}

    return values;
  }

  /**
   * Returns an iterator over indices of existing elements (as determined by {@link has}).
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
   * Returns an iterator over existing values.
   */
  values(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  /**
   * Returns an iterator over existing values.
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
