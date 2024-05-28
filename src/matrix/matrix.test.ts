import { describe, expect, test } from '@jest/globals';
import { Matrix } from './matrix'

describe("Matrix", () => {
    test("it instantiates empty", () => {
        const m = Matrix.square()
        expect(m.sum).toBe(0)
    })

    test("it instantiates empty and increments", () => {
        const m = Matrix.square()
        m.increment("a", "a")
        m.increment("a", "b")
        m.increment("a", "b")
        m.increment("b", "b")
        m.increment("b", "b")
        m.increment("b", "b")
        expect(m.value).toStrictEqual([
            [1, 0],
            [2, 3]
        ])
    })

    test("it instantiate from dto", () => {
        const m = Matrix.square({
            labels: ["a", "b", "c"],
            value: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ],
        })
        expect(m.value).toStrictEqual([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ])
    })

    test("it instantiate from dto and and increments", () => {
        const m = Matrix.square({
            labels: ["a", "b", "c"],
            value: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]
        })
        m.increment("a", "a")
        m.increment("a", "d")
        m.increment("d", "d")
        m.increment("d", "d")
        expect(m.value).toStrictEqual([
            [2, 2, 3, 0],
            [4, 5, 6, 0],
            [7, 8, 9, 0],
            [1, 0, 0, 2]
        ])
    })

    test("it returns the sum", () => {
        const m = Matrix.square({
            labels: ["a", "b", "c"],
            value: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ],
        })
        expect(m.sum).toBe(45)
    })

    test("it returns the row at y-index", () => {
        const m = Matrix.square({
            labels: ["a", "b", "c"],
            value: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]
        })
        expect(m.rowAt(0)).toStrictEqual([1, 2, 3])
        expect(m.rowAt(1)).toStrictEqual([4, 5, 6])
        expect(m.rowAt(2)).toStrictEqual([7, 8, 9])
    })

    // test("it returns the column at x-index", () => {
    //     expect(m.colAt(0)).toStrictEqual([1, 4, 7])
    //     expect(m.colAt(1)).toStrictEqual([2, 5, 8])
    //     expect(m.colAt(2)).toStrictEqual([3, 6, 9])
    // })
})