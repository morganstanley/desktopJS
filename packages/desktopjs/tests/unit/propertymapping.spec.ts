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

import {} from "jasmine";
import { ObjectTransform, PropertyMap } from "../../src/propertymapping";

describe('propertymapping', () => {
    const map: PropertyMap = {
        a: { target: "a1" },
        b: { target: "b1", convert: (value: any, from: any, to: any) => { return "b2"; } },
        c: { target: "c1", convert: (value: any, from: any, to: any) => { return value + from["b"] + to["b1"]; } },
        errorProperty: { target: "b1", convert: (value: any, from: any, to: any) => { throw Error(); } }
    };

    describe("transformProperties", () => {
        it("Simple from to target", () => {
            const input: any = { a: "foo" };
            const output: any = ObjectTransform.transformProperties(input, map);
            expect(output.a1).toEqual("foo");
        });

        it("Target convert", () => {
            const input: any = { b: "foo" };
            const output: any = ObjectTransform.transformProperties(input, map);
            expect(output.b1).toEqual("b2");
        });

        it("Target convert using from/to", () => {
            const input: any = { b: "foo", c: "bar" };
            const output: any = ObjectTransform.transformProperties(input, map);
            expect(output.c1).toEqual("barfoob2");
        });

        it("Unmapped value passes through", () => {
            const input: any = { d: "foobar" };
            const output: any = ObjectTransform.transformProperties(input, map);
            expect(output.d).toEqual("foobar");
        });

        it("Error processing one mapping logs to console and continues", () => {
            const input: any = { errorProperty: "value", a: "foo", d: "foobar" };

            spyOn(console, "error");
            const output: any = ObjectTransform.transformProperties(input, map);
            expect(console.error).toHaveBeenCalledWith("Error transforming property 'errorProperty'");

            expect(output.a1).toEqual("foo");
            expect(output.d).toEqual("foobar");
        });
    });
});