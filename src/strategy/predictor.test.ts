import { describe, expect, test } from '@jest/globals';
import { Predictor } from "./predictor";
import { Bar } from "./bar"
import { Discrete } from './discrete';

describe("Predictor", () => {
    const data = [
        { o: 100, c: 101, t: 0 },
        { o: 101, c: 104, t: 0 },
        { o: 104, c: 103, t: 0 },
        { o: 103, c: 103, t: 0 },
        { o: 100, c: 101, t: 0 },
        { o: 101, c: 100, t: 0 },
    ]

    test("it only makes predictions when it has enough data", () => {
        const predictor = new Predictor(5)
        const predictions = data.map((e) => {
            return predictor.predict(new Bar("TEST", e))
        })

        expect(predictions.slice(0, 5)).toStrictEqual([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        ])
        expect(predictions[5]?.discrete).toBeInstanceOf(Discrete)
        expect(typeof predictions[5]?.probability).toBe("number")
    })
})