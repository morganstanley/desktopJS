/**
 * @module @morgan-stanley/desktopjs
 */

/** Represents a GUID. */
export class Guid {
  /**
   * Creates a new v4 GUID.
   * @see {@link https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29}
   * @returns {string} A new v4 GUID.
   */
  static newGuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
