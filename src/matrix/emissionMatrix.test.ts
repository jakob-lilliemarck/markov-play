import { describe, expect, test } from '@jest/globals';
import { EmissionMatrix } from './emissionMatrix';

describe("Emission matrix", () => {
    const emitted = ["pizza", "burger", "hotdog"]
    const hidden = ["rainy", "sunny"]

    test("it instantiates and increments from empty", () => {
        const m = new EmissionMatrix()

        m.increment('rainy', 'pizza')
        expect(m.matrix.value).toStrictEqual([
            [1]
        ])

        m.increment('sunny', 'pizza')
        expect(m.matrix.value).toStrictEqual([
            [1],
            [1]
        ])

        m.increment('rainy', 'burger')
        expect(m.matrix.value).toStrictEqual([
            [1, 1],
            [1, 0]
        ])

        m.increment('sunny', 'hotdog')
        expect(m.matrix.value).toStrictEqual([
            [1, 1, 0],
            [1, 0, 1]
        ])

        m.increment('sunny', 'hotdog')
        expect(m.matrix.value).toStrictEqual([
            [1, 1, 0],
            [1, 0, 2]
        ])
    })

    test('it instantiates and incremetns from dto', () => {
        const m = new EmissionMatrix({
            labels: [emitted, hidden],
            value: [
                [0, 0, 0],
                [0, 0, 0]
            ]
        })

        m.increment("sunny", "hotdog")
        expect(m.matrix.value).toStrictEqual([
            [0, 0, 0],
            [0, 0, 1]
        ])
    })

    test('it retrieves the values', () => {
        const m = new EmissionMatrix({
            labels: [emitted, hidden],
            value: [
                [1, 2, 3],
                [4, 5, 6]
            ]
        })

        expect(m.valAt(0, 0)).toBe(1)
        expect(m.valAt(1, 0)).toBe(2)
        expect(m.valAt(2, 0)).toBe(3)
        expect(m.valAt(0, 1)).toBe(4)
        expect(m.valAt(1, 1)).toBe(5)
        expect(m.valAt(2, 1)).toBe(6)
    })

    test('it transforms to stochastic', () => {
        const m = new EmissionMatrix({
            labels: [emitted, hidden],
            value: [
                [2, 1, 1],
                [0, 1, 1]
            ]
        })
        expect(m.stochastic().map((a) => a.map((b) => b.toFixed(3)))).toStrictEqual([
            ["0.500", "0.250", "0.250"],
            ["0.000", "0.500", "0.500"]
        ])
    })

    test("it retrieves the index of hidden states", () => {
        const m = new EmissionMatrix({
            labels: [emitted, hidden],
            value: [
                [0, 0, 0],
                [0, 0, 0]
            ]
        })

        expect(m.hiddenIndexOf("rainy")).toBe(0)
        expect(m.hiddenIndexOf("sunny")).toBe(1)
    })

    test("it retrieves the index of emitted states", () => {
        const m = new EmissionMatrix({
            labels: [emitted, hidden],
            value: [
                [0, 0, 0],
                [0, 0, 0]
            ]
        })

        expect(m.emittedIndexOf("pizza")).toBe(0)
        expect(m.emittedIndexOf("burger")).toBe(1)
        expect(m.emittedIndexOf("hotdog")).toBe(2)
    })
})