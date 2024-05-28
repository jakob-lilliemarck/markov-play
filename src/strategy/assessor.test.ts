import { describe, expect, test } from '@jest/globals';
import { Assessor, type Assessment } from './assessor';
import { Discrete } from './discrete';

describe("Assessor", () => {
    // Pairs of a current actual value and a predicted next value
    const data = [
        [
            { discrete: Discrete.fromChange(0.1) },
            { discrete: Discrete.fromChange(0.2) }
        ],
        [
            { discrete: Discrete.fromChange(0.2) }, // hit prediction
            { discrete: Discrete.fromChange(0.3) }
        ],
        [
            { discrete: Discrete.fromChange(0.3) }, // hit prediction
            { discrete: Discrete.fromChange(0.4) }
        ],
        [
            { discrete: Discrete.fromChange(-1.0) }, // missed prediction and lost
            { discrete: Discrete.fromChange(0.5) }
        ],
        [
            { discrete: Discrete.fromChange(0.75) }, // missed prediction but won
            { discrete: Discrete.fromChange(0.5) }
        ],
        [
            { discrete: Discrete.fromChange(0.5) }, // hit prediction
            { discrete: Discrete.fromChange(0.5) }
        ]
    ]

    test("it only makes assessments when it has enough data", () => {
        const assessor = new Assessor(5)
        const assesments = data.map(([actual, predicted]) => {
            return assessor.assess(actual, predicted)
        })

        expect(assesments.slice(0, 5)).toStrictEqual([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        ])
        expect(assesments[5]?.winrate.toFixed(3)).toBe("0.800")
        expect(assesments[5]?.precision.toFixed(3)).toBe("0.600")
        expect(assesments[5]?.recall.toFixed(3)).toBe("0.600")
    })
})