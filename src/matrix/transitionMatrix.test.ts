import { describe, expect, test } from '@jest/globals';
import { TransitionMatrix } from './transitionMatrix'

describe('Transition matrix', () => {
    // Matrix to fixed
    const fixed = (a: Array<number>) => a.map((b) => b.toFixed(3))

    test('it instantiates and increments from empty', () => {
        const m = new TransitionMatrix()

        m.increment("a", "b")
        expect(m.matrix.value).toStrictEqual([
            [0, 1],
            [0, 0]
        ])

        m.increment("b", "c")
        expect(m.matrix.value).toStrictEqual([
            [0, 1, 0],
            [0, 0, 1],
            [0, 0, 0]
        ])

        m.increment("c", "a")
        expect(m.matrix.value).toStrictEqual([
            [0, 1, 0],
            [0, 0, 1],
            [1, 0, 0]
        ])

        m.increment("a", "c")
        expect(m.matrix.value).toStrictEqual([
            [0, 1, 1],
            [0, 0, 1],
            [1, 0, 0]
        ])
    })

    test('it instantiates and increments from dto', () => {
        const m = new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ]
        })

        m.increment("a", "b")
        expect(m.matrix.value).toStrictEqual([
            [0, 1, 0],
            [0, 0, 0],
            [0, 0, 0]
        ])
    })

    test("it calculates the stationary distribution", () => {
        expect(new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [0, 1, 0],
                [1, 0, 0],
                [0, 0, 1]
            ],
        }).pi().map(fixed)).toStrictEqual([
            ["0.500", "0.500", "0.000"],
            ["0.000", "0.000", "1.000"]
        ])

        expect(new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [1, 1, 0],
                [0, 0, 1],
                [1, 0, 0]
            ],
        }).pi().map(fixed)).toStrictEqual([
            ["0.500", "0.250", "0.250"]
        ])

        expect(new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [0, 1, 1],
                [0, 0, 1],
                [1, 0, 0]
            ],
        }).pi().map(fixed)).toStrictEqual([
            ["0.400", "0.200", "0.400"]
        ])
    })

    test("it retrieves values", () => {
        const m = new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]
        })

        expect(m.valAt(0, 0)).toBe(1)
        expect(m.valAt(1, 0)).toBe(2)
        expect(m.valAt(2, 0)).toBe(3)
        expect(m.valAt(0, 1)).toBe(4)
        expect(m.valAt(1, 1)).toBe(5)
        expect(m.valAt(2, 1)).toBe(6)
        expect(m.valAt(0, 2)).toBe(7)
        expect(m.valAt(1, 2)).toBe(8)
        expect(m.valAt(2, 2)).toBe(9)
    })

    test("it transforms to stochastic", () => {
        const m = new TransitionMatrix({
            labels: ["a", "b", "c"],
            value: [
                [1, 0, 0],
                [2, 1, 0],
                [3, 2, 1]
            ]
        })
        expect(m.stochastic().map(fixed)).toStrictEqual([
            ["1.000", "0.000", "0.000"],
            ["0.667", "0.333", "0.000"],
            ["0.500", "0.333", "0.167"]
        ])
    })

    test('it returns transition probabilities for a given state', () => {
        const fixed = (e: [string, number]) => ({ class: e[0], probability: e[1].toFixed(3) })
        const m = new TransitionMatrix()

        m.increment("a", "b")
        expect(m.next("a").map(fixed)).toStrictEqual([
            { class: "a", probability: "0.000" },
            { class: "b", probability: "1.000" }
        ])

        m.increment("b", "c")
        expect(m.next("b").map(fixed)).toStrictEqual([
            { class: "a", probability: "0.000" },
            { class: "b", probability: "0.000" },
            { class: "c", probability: "1.000" }
        ])

        m.increment("c", "a")
        expect(m.next("c").map(fixed)).toStrictEqual([
            { class: "a", probability: "1.000" },
            { class: "b", probability: "0.000" },
            { class: "c", probability: "0.000" }
        ])

        m.increment("a", "c")
        expect(m.next("a").map(fixed)).toStrictEqual([
            { class: "a", probability: "0.000" },
            { class: "b", probability: "0.500" },
            { class: "c", probability: "0.500" }
        ])

        m.increment("c", "a")
        expect(m.next("c").map(fixed)).toStrictEqual([
            { class: "a", probability: "1.000" },
            { class: "b", probability: "0.000" },
            { class: "c", probability: "0.000" }
        ])

        m.increment("a", "c")
        expect(m.next("a").map(fixed)).toStrictEqual([
            { class: "a", probability: "0.000" },
            { class: "b", probability: "0.333" },
            { class: "c", probability: "0.667" }
        ])

        m.increment("c", "a")
        expect(m.next("c").map(fixed)).toStrictEqual([
            { class: "a", probability: "1.000" },
            { class: "b", probability: "0.000" },
            { class: "c", probability: "0.000" }
        ])

        m.increment("a", "c")
        expect(m.next("a").map(fixed)).toStrictEqual([
            { class: "a", probability: "0.000" },
            { class: "b", probability: "0.250" },
            { class: "c", probability: "0.750" }
        ])
    })
})