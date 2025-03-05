import { callOrGet } from './lang';

const { floor } = Math;

const BLOCK_LENGTH = Number.MAX_SAFE_INTEGER / 0x13731a1;

/**
 * A mutable array that can store up to 2&#8239;^&#8239;54&#8239;-&#8239;2 elements.
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
  private _negativeBlocks: T[][] = [];
  private _positiveBlocks: T[][] = [];

  /**
   * An index of the first element in an array, inclusive.
   */
  startIndex = 0;

  /**
   * An index of the last element in an array, exclusive.
   */
  endIndex = 0;

  /**
   * Returns an element stored at an index or `undefined`.
   *
   * @param index An integer index of an element.
   */
  get(index: number): T | undefined {
    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const blockIndex = floor(index / BLOCK_LENGTH);

    const block = blocks[blockIndex];

    if (block === undefined) {
      return undefined;
    }

    return block[index - blockIndex * BLOCK_LENGTH];
  }

  /**
   * Returns an element stored at an index or uses {@link lazyValue} to produce an element.
   *
   * @param index An integer index of an element.
   * @param lazyValue A value or a callback that returns a value for an index.
   * @returns A value stored at an index.
   */
  getOrSet(index: number, lazyValue: T | ((index: number) => T)): T {
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

    const blockIndex = floor(i / BLOCK_LENGTH);
    const valueIndex = i - blockIndex * BLOCK_LENGTH;

    let block = blocks[blockIndex];

    if (block === undefined) {
      block = blocks[blockIndex] = [];
    }

    return valueIndex in block ? block[valueIndex] : (block[valueIndex] = callOrGet(lazyValue, index));
  }

  /**
   * Sets an element at an index.
   *
   * @param index An integer index of an element.
   * @param value A value to set.
   */
  set(index: number, value: T): void {
    const { startIndex, endIndex } = this;

    if (startIndex === endIndex) {
      this.startIndex = index;
      this.endIndex = index + 1;
    } else if (index >= endIndex) {
      this.endIndex = index + 1;
    } else if (index < startIndex) {
      this.startIndex = index;
    }

    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const blockIndex = floor(index / BLOCK_LENGTH);

    let block = blocks[blockIndex];

    if (block === undefined) {
      block = blocks[blockIndex] = [];
    }

    block[index - blockIndex * BLOCK_LENGTH] = value;
  }

  /**
   * Returns `true` if an array contains an element with the {@link index}.
   *
   * @param index An integer index of an element.
   */
  has(index: number): boolean {
    const blocks = index >= 0 ? this._positiveBlocks : ((index = -index - 1), this._negativeBlocks);

    const blockIndex = floor(index / BLOCK_LENGTH);

    const block = blocks[blockIndex];

    return block !== undefined && index - blockIndex * BLOCK_LENGTH in block;
  }

  /**
   * Appends an element to an array after the {@link endIndex}.
   *
   * @param value A value to append.
   */
  push(value: T): void {
    this.set(this.endIndex, value);
  }

  /**
   * Prepends an element to an array before the {@link startIndex}.
   *
   * @param value A value to prepend.
   */
  unshift(value: T): void {
    this.set(this.startIndex - 1, value);
  }

  /**
   * Returns a new iterator object that contains indexes of {@link has existing elements}.
   */
  *indexes(): IterableIterator<number> {
    const { _negativeBlocks, _positiveBlocks } = this;

    for (const blockKey in _negativeBlocks) {
      const blockOffset = +blockKey * BLOCK_LENGTH;

      for (const valueKey in _negativeBlocks[blockKey]) {
        yield -(blockOffset + +valueKey) - 1;
      }
    }

    for (const blockKey in _positiveBlocks) {
      const blockOffset = +blockKey * BLOCK_LENGTH;

      for (const valueKey in _positiveBlocks[blockKey]) {
        yield blockOffset + +valueKey;
      }
    }
  }
}
