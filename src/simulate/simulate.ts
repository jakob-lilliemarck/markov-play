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

export interface IStrategy {
    increment(ticker: string, data: IBar): void
    report(): unknown
}

export class Simulate<T extends IStrategy> {
    strategy: T
    bars: Array<[string, IBar]>

    constructor(strategy: T, bars: Array<[string, IBar]>) {
        this.strategy = strategy
        this.bars = bars
    }

    run() {
        this.bars.forEach(([ticker, bar]) => {
            this.strategy.increment(ticker, bar)
        })

        const report = this.strategy.report()

        // console.log(JSON.stringify(report, null, 4))
    }
}