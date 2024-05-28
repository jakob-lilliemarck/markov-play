import { describe, expect, test } from '@jest/globals';
import { ConfusionMatrix } from './confusionMatrix';

describe("Confusion matrix", () => {
    const value = [
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 1]
    ]
    const labels = ["rainy", "overcast", "sunny"]
    const dto = { value, labels }
    const m = new ConfusionMatrix(dto)

    test("it only instantiates valid matrices", () => {
        // The matrix must be square
        expect(() => new ConfusionMatrix({
            labels: ["a", "b"],
            value: [
                [1, 0, 0],
                [1, 0, 0]
            ],
        })).toThrow(Error)
    })

    test("it calculates tp, fp, np, tn", () => {
        expect(m.tp(0)).toBe(1)
        expect(m.tn(0)).toBe(2)
        expect(m.fn(0)).toBe(1)
        expect(m.fp(0)).toBe(0)

        expect(m.tp(1)).toBe(1)
        expect(m.tn(1)).toBe(2)
        expect(m.fn(1)).toBe(0)
        expect(m.fp(1)).toBe(1)

        expect(m.tp(2)).toBe(1)
        expect(m.tn(2)).toBe(3)
        expect(m.fn(2)).toBe(0)
        expect(m.fp(2)).toBe(0)
    })

    test("it calculates precision for each class", () => {
        expect(m.precision(0)).toBe(1)
        expect(m.precision(1)).toBe(0.5)
        expect(m.precision(2)).toBe(1)
    })

    test("it calculates recall for each class", () => {
        expect(m.recall(0)).toBe(0.5)
        expect(m.recall(1)).toBe(1)
        expect(m.recall(2)).toBe(1)
    })

    test("it calculates the accuracy", () => {
        expect(m.accuracy()).toBe(0.75)
    })

    test("it calculates the macro average recall and precision", () => {
        const { recall, precision } = m.macro()
        expect(recall.toFixed(4)).toBe("0.8333")
        expect(precision.toFixed(4)).toBe("0.8333")
    })

    test("it calculates the micro average recall and precision", () => {
        const { recall, precision } = m.micro()
        expect(recall.toFixed(4)).toBe("0.7500")
        expect(precision.toFixed(4)).toBe("0.7500")
    })
})