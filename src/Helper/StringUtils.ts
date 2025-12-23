/**
 * String utility functions
 */

export const StringUtils = {
  /**
   * Capitalize first letter of a string
   */
  capitalize: (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Truncate string to specified length
   */
  truncate: (str: string, length: number): string => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  /**
   * Check if string is empty or whitespace
   */
  isEmpty: (str: string | null | undefined): boolean => {
    return !str || str.trim().length === 0;
  },

  /**
   * Remove whitespace from both ends
   */
  trim: (str: string): string => {
    return str.trim();
  },

  /**
   * Convert string to lowercase
   */
  toLowerCase: (str: string): string => {
    return str.toLowerCase();
  },

  /**
   * Convert string to uppercase
   */
  toUpperCase: (str: string): string => {
    return str.toUpperCase();
  },

  /**
   * Replace all occurrences of a substring
   */
  replaceAll: (str: string, search: string, replace: string): string => {
    return str.split(search).join(replace);
  },

  /**
   * Check if string contains substring
   */
  contains: (str: string, substring: string): boolean => {
    return str.includes(substring);
  },

  /**
   * Get initials from name
   */
  getInitials: (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  },
};

