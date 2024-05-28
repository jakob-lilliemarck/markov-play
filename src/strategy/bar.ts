import { Discrete } from "./discrete"

/**
 * Reference: https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to
 */
export interface IBar {
    h: number   // high
    l: number   // low
    o: number   // open
    c: number   // close
    n: number   // number of transactions
    t: number   // unix timestamp
    v: number   // volume
    vw: number  // volume weighted average
}

export class Bar {
    ticker: string
    open: number
    close: number
    time: number
    change: number
    discrete: Discrete

    constructor(ticker: string, bar: { o: number, c: number, t: number }) {
        this.ticker = ticker
        this.open = bar.o
        this.close = bar.c
        this.time = bar.t
        this.change = bar.c / bar.o - 1
        this.discrete = Discrete.fromChange(this.change)
    }
}