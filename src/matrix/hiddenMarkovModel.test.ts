import { describe, expect, test } from '@jest/globals';
import { Hmm } from './hiddenMarkovModel';

// pnpm jest -- src/prediction/hiddenMarkovModel.test.ts
describe("Hidden markov model", () => {
    const hidden = ["rainy", "sunny"]
    const emitted = ["sad", "happy"]

    test("it instantiates empty and increments", () => {
        const m = new Hmm()
        // first increment, no transition takes place
        // rainy emits happy
        m.increment("rainy", "sad")
        expect(m.transitionMatrix.value).toStrictEqual([])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1]
        ])

        // rainy transitions to sunny
        // sunny emits happy
        m.increment("sunny", "happy")
        expect(m.transitionMatrix.value).toStrictEqual([
            [0, 1],
            [0, 0]
        ])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1, 0],
            [0, 1]
        ])

        // sunny transitions to rainy
        // rainy emits happy
        m.increment("rainy", "happy")
        expect(m.transitionMatrix.value).toStrictEqual([
            [0, 1],
            [1, 0]
        ])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1, 1],
            [0, 1]
        ])

    })

    test("it instantiates from dto and increments", () => {
        const m = new Hmm({
            transitionMatrix: {
                labels: hidden,
                value: [
                    [0, 0],
                    [0, 0]
                ],
            },
            emissionMatrix: {
                value: [
                    [0, 0],
                    [0, 0]
                ],
                labels: [emitted, hidden]
            }
        })

        // first increment, no transition takes place
        // rainy emits happy
        m.increment("rainy", "sad")
        expect(m.transitionMatrix.value).toStrictEqual([
            [0, 0],
            [0, 0]
        ])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1, 0],
            [0, 0]
        ])

        // rainy transitions to sunny
        // sunny emits happy
        m.increment("sunny", "happy")
        expect(m.transitionMatrix.value).toStrictEqual([
            [0, 1],
            [0, 0]
        ])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1, 0],
            [0, 1]
        ])

        // sunny transitions to rainy
        // rainy emits happy
        m.increment("rainy", "happy")
        expect(m.transitionMatrix.value).toStrictEqual([
            [0, 1],
            [1, 0]
        ])
        expect(m.emissionMatrix.value).toStrictEqual([
            [1, 1],
            [0, 1]
        ])
    })

    test("it computes the probability of a given sequence", async () => {
        const fixed = (e: number) => e.toFixed(4)
        // Example from: https://www.youtube.com/watch?v=9-sPm4CfcD0
        const m = new Hmm({
            transitionMatrix: {
                labels: hidden,
                value: [
                    [0.5, 0.5],
                    [0.3, 0.7]
                ],
            },
            emissionMatrix: {
                value: [
                    [0.8, 0.2],
                    [0.4, 0.6]
                ],
                labels: [emitted, hidden]
            }
        })

        expect(m.forward(["sad", "sad", "happy"]).map(fixed)).toStrictEqual(["0.1344"])
    })
})