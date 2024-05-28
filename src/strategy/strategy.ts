import { Bar, type IBar } from "./bar"
import { Oracle } from "./oracle"
import { Bettor } from "./bettor";
import { IStrategy } from "simulate/simulate";

export class Strategy implements IStrategy {
    bettor: Bettor
    oracles: Map<string, Oracle>

    constructor(tickers: Array<string>) {
        this.bettor = new Bettor({ capital: 10_000 })
        this.oracles = new Map()

        tickers.forEach((ticker) => {
            this.oracles.set(ticker, new Oracle(ticker, 600))
        })
    }

    increment(ticker: string, data: IBar) {
        const oracle = this.oracles.get(ticker)

        if (oracle === undefined) return
        const bar = new Bar(ticker, data)
        const ask = oracle.ask(bar)

        if (ask === undefined) return
        const transactions = this.bettor.bet(ask)
        transactions?.forEach((t) => {
            console.log(ticker)
            console.log({ transactions: t })
            console.log(this.bettor.positions)
            console.log('\n--- --- ---')
        })
    }

    report() {
        return Array.from(this.oracles).reduce((a, [ticker, oracle], i, arr) => {
            const { precision, recall } = oracle.assessor.mxConfusion.micro()
            const winrate = oracle.assessor.winrate
            return {
                ...a,
                components: [...a.components, { ticker, precision, recall, winrate }],
                precision: a.precision + precision / arr.length,
                recall: a.recall + recall / arr.length,
                winrate: a.winrate + winrate / arr.length,
            }
        }, {
            components: [] as Array<{
                ticker: string,
                precision: number,
                recall: number,
                winrate: number
            }>,
            precision: 0,
            recall: 0,
            winrate: 0,
            unallocated: this.bettor.capital,
            allocated: this.bettor.positions
        })
    }
}