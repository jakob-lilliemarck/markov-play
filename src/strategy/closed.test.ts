import { describe, expect, test } from '@jest/globals';
import { Closed } from './closed';

describe("Closed", () => {
    test("it returns a tuple of [lhs, rhs]", () => {
        const closed = new Closed("lhs", "rhs")
        expect(closed.toTuple()).toStrictEqual(["lhs", "rhs"])
    })
})