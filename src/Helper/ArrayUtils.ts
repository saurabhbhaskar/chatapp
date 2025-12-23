/**
 * Array utility functions
 */

export const ArrayUtils = {
  /**
   * Remove duplicates from array
   */
  removeDuplicates: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },

  /**
   * Group array by key
   */
  groupBy: <T>(
    array: T[],
    key: keyof T | ((item: T) => string),
  ): {[key: string]: T[]} => {
    return array.reduce((result, item) => {
      const groupKey =
        typeof key === 'function' ? key(item) : String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as {[key: string]: T[]});
  },

  /**
   * Sort array by key
   */
  sortBy: <T>(
    array: T[],
    key: keyof T | ((item: T) => any),
    order: 'asc' | 'desc' = 'asc',
  ): T[] => {
    const sorted = [...array].sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  },

  /**
   * Find item in array by key-value pair
   */
  findBy: <T>(array: T[], key: keyof T, value: any): T | undefined => {
    return array.find(item => item[key] === value);
  },

  /**
   * Filter array by multiple conditions
   */
  filterBy: <T>(
    array: T[],
    conditions: Partial<T> | ((item: T) => boolean),
  ): T[] => {
    if (typeof conditions === 'function') {
      return array.filter(conditions);
    }
    return array.filter(item => {
      return Object.keys(conditions).every(
        key => item[key as keyof T] === conditions[key as keyof T],
      );
    });
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Flatten nested array
   */
  flatten: <T>(array: (T | T[])[]): T[] => {
    return array.reduce((acc, val) => {
      return acc.concat(Array.isArray(val) ? ArrayUtils.flatten(val) : val);
    }, [] as T[]);
  },
};

