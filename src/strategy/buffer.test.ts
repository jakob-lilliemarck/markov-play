import { describe, expect, test } from '@jest/globals';
import { Buffer } from "./buffer"

describe("Buffer", () => {
    test("it returns decrements when full", () => {
        const buffer = new Buffer<number>(3)
        const d1 = buffer.add(1)
        const d2 = buffer.add(2)
        const d3 = buffer.add(3)
        const d4 = buffer.add(4)
        const d5 = buffer.add(5)
        const d6 = buffer.add(6)

        expect(d1).toBe(undefined)
        expect(d2).toBe(undefined)
        expect(d3).toBe(undefined)
        expect(d4).toBe(1)
        expect(d5).toBe(2)
        expect(d6).toBe(3)
    })

    test("it aggregates when saturated", () => {
        const buffer = new Buffer<number>(3)
        buffer.add(1)
        buffer.add(2)
        buffer.add(3)
        const aggregate = buffer.aggregate((buf) => buf.reduce((a, e) => a + e, 0))
        expect(aggregate).toBe(6)
    })

    test("it does not aggregate when not saturated", () => {
        const buffer = new Buffer<number>(3)
        buffer.add(1)
        buffer.add(2)
        const aggregate = buffer.aggregate((buf) => buf.reduce((a, e) => a + e, 0))
        expect(aggregate).toBe(undefined)
    })
})