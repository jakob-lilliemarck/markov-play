import { describe, expect, test } from '@jest/globals';
import { Bar } from "./bar"
import { Discrete } from './discrete';

describe("Bar", () => {
    test("it computes change", () => {
        const bar = new Bar("TEST", { o: 100, c: 102, t: 0 })
        expect(bar.change.toFixed(2)).toBe("0.02")
    })

    test("it discretizes", () => {
        const bar = new Bar("TEST", { o: 100, c: 102, t: 0 })
        expect(bar.discrete.str).toBe(Discrete.fromChange(0.02).str)
    })
})