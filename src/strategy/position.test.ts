import { describe, expect, test } from '@jest/globals';
import { Position } from './position';

describe("Position", () => {
    test("it computes its value", () => {
        const p = new Position("TEST", 100, 5, "LONG")
        expect(p.value).toBe(500)
    })

    test("it rebalances long positions", () => {
        const p = new Position("TEST", 100, 10, "LONG")
        const [transaction, position] = p.rebalance(95, 2, 0)

        expect(transaction.ticker).toBe("TEST")
        expect(transaction.price).toBe(95)
        expect(transaction.qty).toBe(-8)
        expect(transaction.type).toBe("LONG")
        expect(transaction.value).toBe(95 * 8)

        expect(position.ticker).toBe("TEST")
        expect(position.price).toBe(95)
        expect(position.qty).toBe(2)
        expect(position.type).toBe("LONG")
        expect(position.value).toBe(95 * 2)
    })

    test("it rebalances short positions", () => {
        const p = new Position("TEST", 100, 10, "SHORT")
        const [transaction, position] = p.rebalance(95, 2, 0)

        expect(transaction.ticker).toBe("TEST")
        expect(transaction.price).toBe(105)
        expect(transaction.qty).toBe(-8)
        expect(transaction.type).toBe("SHORT")
        expect(transaction.value).toBe(105 * 8)

        expect(position.ticker).toBe("TEST")
        expect(position.price).toBe(105)
        expect(position.qty).toBe(2)
        expect(position.type).toBe("SHORT")
        expect(position.value).toBe(105 * 2)
    })

    test("it sells itself", () => {
        const p = new Position("TEST", 100, 10, "LONG")
        const transaction = p.sell(95, 0)

        expect(transaction.ticker).toBe("TEST")
        expect(transaction.price).toBe(95)
        expect(transaction.qty).toBe(-10)
        expect(transaction.type).toBe("LONG")
        expect(transaction.value).toBe(950)
    })
})