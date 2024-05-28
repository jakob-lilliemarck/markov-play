import { describe, expect, test } from '@jest/globals';
import { Discrete } from './discrete';

describe("Discrete", () => {
    test("it discretizes", () => {
        const u1 = Discrete.fromChange(0.1)
        const u2 = Discrete.fromChange(0.75)
        const d3 = Discrete.fromChange(-1.5)
        const n0 = Discrete.fromChange(0)

        expect(u1.str).toBe("U1")
        expect(u2.str).toBe("U2")
        expect(d3.str).toBe("D3")
        expect(n0.str).toBe("N0")
    })

    test("it instantiates from string", () => {
        const u1 = Discrete.fromString("U1")
        expect(u1.side).toBe("U")
        expect(u1.size).toBe(1)
        expect(u1.str).toBe("U1")
    })
})