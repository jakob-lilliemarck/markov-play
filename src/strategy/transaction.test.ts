import { describe, expect, test } from '@jest/globals';
import { Transaction } from './transaction';

describe("Transaction", () => {
    test("", () => {
        const bought = new Transaction("TEST", 100, 0, 5, "LONG")
        const sold = new Transaction("TEST", 100, 0, -5, "SHORT")

        expect(bought.value.toFixed(0)).toBe("-500")
        expect(sold.value.toFixed(0)).toBe("500")
    })
})