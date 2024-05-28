import { describe, expect, test } from '@jest/globals';
import { Summary, Discretizer } from './model';
import { Bar } from "../strategy/bar"

describe("", () => {
    test("", () => {
        const data = [
            { o: 100, c: 101, t: 0 },
            { o: 102, c: 103, t: 0 },
            { o: 103, c: 104, t: 0 },
            { o: 104, c: 105, t: 0 },

            { o: 105, c: 106, t: 0 },
            { o: 106, c: 107, t: 0 },
        ].map((e) => new Bar("TEST", e))

        const s = new Summary(4)
        const d = new Discretizer()

        console.log(data.map((bar) => d.increment(bar)))
    })

})