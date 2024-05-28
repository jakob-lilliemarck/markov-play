import { describe, expect, test } from '@jest/globals';
import { Open } from './open';

describe("Open", () => {
    test("it closes", () => {
        const open = new Open("lhs")
        const closed = open.close("rhs")
        expect(closed.toTuple()).toStrictEqual(["lhs", "rhs"])
    })
})