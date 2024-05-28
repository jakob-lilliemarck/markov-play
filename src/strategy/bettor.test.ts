import { describe, expect, test } from '@jest/globals';
import { Bettor } from "./bettor"
import { Discrete } from "./discrete";
import { Bar } from "./bar";

describe("Bettor", () => {
    test("it bets when performance is better than random", () => {
        const bettor = new Bettor({ capital: 10_000 })

        const transactions = bettor.bet({
            actual: new Bar("TEST", { o: 100, c: 101, t: 0 }),
            prediction: {
                discrete: Discrete.fromChange(0.5),
                probability: 0.55
            },
            assessment: {
                recall: 0.51,
                precision: 0.51,
                winrate: 0.51
            }
        })

        expect(transactions).toBeTruthy()
    })

    test("it doesn't bet when performance is random or worse", () => {
        const bettor = new Bettor({ capital: 10_000 })

        const transactions = bettor.bet({
            actual: new Bar("TEST", { o: 100, c: 101, t: 0 }),
            prediction: {
                discrete: Discrete.fromChange(0.5),
                probability: 0.55
            },
            assessment: {
                recall: 0.50,
                precision: 0.50,
                winrate: 0.50
            }
        })

        expect(transactions).toStrictEqual([])
    })
})