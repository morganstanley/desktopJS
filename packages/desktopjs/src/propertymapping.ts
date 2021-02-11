/**
 * @module @morgan-stanley/desktopjs
 */

/** Represents a mapping of an object property to a target property with an optional conversion mapping. */
export class PropertyMap {
  [id: string]: {
    target: string;
    convert?: (value: any, from: any, to: any) => any;
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ObjectTransform {
  /** Transform an object given a PropertyMap.
   * @param {any} object Input object to transform.
   * @param {PropertyMap} mappings Transformations to apply to the input.
   * @returns {any} A new object cloned from the original with the applied PropertyMap.
   */
  // eslint-disable-next-line no-inner-declarations
  export function transformProperties(object: any, mappings: PropertyMap): any {
    const newOptions = {};

    if (object) {
      for (const prop in object) {
        try {
          if (prop in mappings) {
            newOptions[mappings[prop].target] = mappings[prop].convert
              ? mappings[prop].convert(object[prop], object, newOptions)
              : object[prop];
          } else {
            newOptions[prop] = object[prop];
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Error transforming property '" + prop + "'");
        }
      }
    }

    return newOptions;
  }
}
