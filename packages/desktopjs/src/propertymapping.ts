/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

/**
 * @module @morgan-stanley/desktopjs
 */

/** Represents a mapping of an object property to a target property with an optional conversion mapping. */
export class PropertyMap {
    [id: string]: { target: string, convert?: (value: any, from: any, to: any) => any };
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
                        newOptions[mappings[prop].target] = (mappings[prop].convert)
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
