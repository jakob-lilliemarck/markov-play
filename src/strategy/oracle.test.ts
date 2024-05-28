import { describe, expect, test } from '@jest/globals';
import { Oracle } from "./oracle";
import { Bar } from "./bar";
import { Discrete } from "./discrete";

describe("Oracle", () => {
    const data = [
        { o: 100, c: 101, t: 0 },
        { o: 101, c: 104, t: 0 },
        { o: 104, c: 103, t: 0 },
        { o: 103, c: 103, t: 0 },
        { o: 100, c: 101, t: 0 },
        { o: 101, c: 100, t: 0 },
        { o: 100, c: 101, t: 0 },
        { o: 101, c: 104, t: 0 },
        { o: 104, c: 103, t: 0 },
        { o: 103, c: 103, t: 0 },
        { o: 100, c: 101, t: 0 },
    ]

    test("it only answers asks when it has enough data", () => {
        const oracle = new Oracle("TEST", 5)
        const asks = data.map((e) => oracle.ask(new Bar("TEST", e)))

        expect(asks.slice(0, 10)).toStrictEqual([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        ])
        expect(typeof asks[10]?.assessment.winrate).toBe("number")
        expect(typeof asks[10]?.assessment.precision).toBe("number")
        expect(typeof asks[10]?.assessment.recall).toBe("number")
        expect(typeof asks[10]?.prediction.probability).toBe("number")
        expect(asks[10]?.prediction.discrete).toBeInstanceOf(Discrete)
        expect(asks[10]?.actual).toBeInstanceOf(Bar)
    })
})