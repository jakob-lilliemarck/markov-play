import { type Square } from 'matrix/matrix'
import { Bar } from '../strategy/bar'
import { Open } from '../strategy/open'
import { Buffer } from '../strategy/buffer'
import { TransitionMatrix } from '../matrix/transitionMatrix'
import { Closed } from 'strategy/closed'
import { IBar } from '../simulate/simulate'
import { ConfusionMatrix } from 'matrix'

export class Summary {
    private mean: number = 0;
    private sumOfSquaredDifferences: number = 0;
    private size: number
    private values: Array<number>

    constructor(size: number) {
        // if (size < 2) throw Error("")
        this.size = size
        this.values = []
    }

    public next(incr: number): ISummary {
        this.add(incr)

        if (this.values.length > this.size) {
            const decr = this.values.shift()
            if (decr !== undefined) {
                this.remove(decr)
            }
        }

        return {
            length: this.size,
            variance: this.variance(),
            stddev: this.stddev(),
            mean: this.mean,
        }
    }

    private add(price: number): void {
        this.values.push(price);
        const previousMean = this.mean;
        this.mean += (price - this.mean) / this.values.length;
        this.sumOfSquaredDifferences += (price - previousMean) * (price - this.mean);
    }

    private remove(price: number): void {
        if (this.values.length < this.size) throw new Error("Invalid operation: removing before window is filled");
        const previousMean = this.mean;
        this.mean = ((this.values.length + 1) * this.mean - price) / this.values.length;
        this.sumOfSquaredDifferences -= (price - this.mean) * (price - previousMean);
    }

    stddev(): number {
        if (this.values.length < 2) return 0;
        return Math.sqrt(this.variance());
    }

    variance(): number {
        if (this.values.length < 2) return 0;
        return this.sumOfSquaredDifferences / this.values.length;
    }
}

export class Discretizer {
    summary: Summary
    thres: Array<number>
    start: number
    trend?: "BEAR" | "BULL"
    prev?: number

    constructor(summary: Summary, thres: Array<number>) {
        this.summary = summary
        this.thres = thres.toSorted()
        this.start = 0
    }

    increment(price: number) {
        this.summary.next(price)

        const trend = this.getTrend(this.prev ?? price, price)
        const stddev = this.summary.stddev()

        this.prev = price
        if (trend !== this.trend) {
            this.start = price
            this.trend = trend
        }

        return {
            state: `${this.trend}:${this.getSize(this.start - price, stddev, this.thres)}`,
            change: price - this.start
        }
    }

    get labels() {
        const labels = []
        for (let x = this.thres.length + 1; x > 0; x--) {
            labels.push(`BULL:${x}`)
        }
        for (let x = 0; x < this.thres.length + 1; x++) {
            labels.push(`BEAR:${x + 1}`)
        }
        return labels
    }

    private getSize(accumulated: number, stddev: number, thres: Array<number>) {
        const n = Math.abs(accumulated) / stddev
        return thres.reduce((a, t, i) => n > t ? a + 1 : a, 1)
    }

    private getTrend(open: number, close: number): "BEAR" | "BULL" {
        const change = close / open - 1
        return change < 0 ? "BEAR" : "BULL"
    }
}

export class Predict {
    tmx: TransitionMatrix
    win: Buffer<Closed<string>>
    size: number
    open?: Open<string>

    constructor(size: number, tmx: TransitionMatrix) {
        this.tmx = tmx
        this.win = new Buffer(size)
        this.size = size
    }

    increment(state: string) {
        if (this.open !== undefined) {
            const incr = this.open.close(state)
            const decr = this.win.add(incr)
            this.tmx.increment(incr.lhs, incr.rhs)
            if (decr !== undefined) {
                this.tmx.decrement(decr.lhs, decr.rhs)
            }
        }

        this.open = new Open(state)

        if (this.win.length < this.size) return

        const [discrete, probability] = this.tmx.next(state).sort((a, b) => b[1] - a[1])[0]

        return {
            discrete,
            probability
        }
    }
}



/// 
/// 
/// 

interface ISummary {
    length: number,
    variance: number,
    stddev: number,
    mean: number
}

enum TREND {
    BULL = "BULL",
    BEAR = "BEAR"
}

interface IDiscrete {
    state: string
    trend: TREND
    trendChange: number
    trendVolume: number
    trendLength: number
    summary: ISummary
}

interface IDisc {
    eval(bar: IBar): IDiscrete
}

// TODO
// Consider making discretizing from a number and thres-array only
// eval() would have to take the value to be evaluated against the thres-array directly
// It can't rely on internal aggregation etc.
//
// const discretizers = [new Dis("VOL", [0.5, 1.0]), new Dis("CHG", [0.25, 0.5])]
// const discrete = discretizers.reduce((a, d) => `${a}_${d.evaluate(value)}`, "")

export class Dis {
    prefix: string
    thres: Array<number>

    constructor(prefix: string, thres: Array<number>) {
        this.prefix = prefix
        this.thres = thres
    }

    evaluate(value: number) {
        const size = this.thres.reduce(
            (a, t) => value > t
                ? a + 1
                : a,
            1
        )
        return `${this.prefix}${size}`
    }

    get labels() {
        const labels = []
        for (let i = 0; i < this.thres.length + 1; i++) {
            labels.push(`${this.prefix}${i + 1}`)
        }
        return labels
    }
}

export class Disc implements IDisc {
    thres: Array<number>
    trend?: TREND
    trendChange: number
    trendVolume: number
    trendLength: number
    summary: Summary

    constructor(summary: Summary, thres: Array<number>) {
        this.thres = thres
        this.trendChange = 0
        this.trendVolume = 0
        this.trendLength = 0
        this.summary = summary
    }

    eval(bar: IBar): IDiscrete {
        const change = bar.c - bar.o
        const trend = this.getTrend(change)
        const summary = this.summary.next(bar.c)

        if (trend !== this.trend) {
            this.trend = trend
            this.trendChange = change
            this.trendVolume = bar.v
            this.trendLength = 1
        } else {
            this.trendChange += change
            this.trendVolume += bar.v
            this.trendLength += 1
        }

        const size = this.getSize(
            this.trendChange,
            summary.stddev,
            this.thres
        )

        return {
            state: `${trend}:${size}`,
            trend: this.trend,
            trendChange: this.trendChange,
            trendVolume: this.trendVolume,
            trendLength: this.trendLength,
            summary
        }
    }

    get labels() {
        const labels = []
        for (let x = this.thres.length + 1; x > 0; x--) {
            labels.push(`BULL:${x}`)
        }
        for (let x = 0; x < this.thres.length + 1; x++) {
            labels.push(`BEAR:${x + 1}`)
        }
        return labels
    }

    private getSize(
        accumulated: number,
        stddev: number,
        thres: Array<number>
    ) {
        const n = Math.abs(accumulated) / stddev
        return thres.reduce((a, t, i) => n > t ? a + 1 : a, 1)
    }

    private getTrend(change: number): TREND {
        return change < 0
            ? TREND.BEAR
            : TREND.BULL
    }
}

interface IPrediction {
    probability: number,
    predicted: string
}

enum SIDE {
    BUY = "BUY",
    SELL = "SELL"
}

enum SIGNAL {
    LONG,
    SHORT,
    HOLD
}

interface ITransaction {
    ticker: string
    price: number
    qty: number
    side: SIDE
}

interface Step {
    // The price of the asset
    price: number
    // Standard deviation, length specifies the period to consider for stddev.
    summary: ISummary
    // The discrete state at this timestep
    state: string
    // Trend direction
    trend: TREND
    // The cumulative price change during this trend
    trendChange: number
    // The cumulative volume during this trend
    trendVolume: number
    // The number of consecutive timesteps on this trend
    trendLength: number
    //  The total capital, both assets and cash
    capital: number
    // The sum of all held positions 
    capitalAllocated: number
    // The unallocated capital
    capitalUnallocated: number
    // A transaction, if one was made during this timestep
    transactions: Array<ITransaction>
    // The predicted next state
    predicted: string
    // The probability of the prediction to come true
    probability: number,
    // Model performance
    performance: { precision: number, recall: number }
}

interface ISim {
    next(ticker: string, bar: IBar): undefined | Step
}

interface BuyOrder {
    ticker: string
    price: number
    qty: number
    side: SIDE.BUY
    position?: Position
}

interface SellOrder {
    ticker: string
    price: number
    qty: number
    side: SIDE.SELL
    position: Position
}

type Order = SellOrder | BuyOrder

class Position {
    ticker: string
    price: number
    currentPrice: number
    qty: number

    constructor(dto: { ticker: string, price: number, qty: number }) {
        this.ticker = dto.ticker
        this.price = dto.price
        this.currentPrice = dto.price
        this.qty = dto.qty
    }

    get value() {
        return this.qty * this.currentPrice
    }

    subtract(qtyChange: number): Position {
        if (qtyChange <= 0) throw new Error("Attempt to change qty with 0 or less")
        this.qty = this.qty - qtyChange
        return this
    }

    add(price: number, qtyChange: number): Position {
        if (qtyChange <= 0) throw new Error("Attempt to change qty with 0 or less")
        const newQty = this.qty + qtyChange
        const newPrice = (this.price * this.qty + price * qtyChange) / newQty
        this.price = newPrice
        this.qty = newQty
        return this
    }

    setCurrentPrice(currentPrice: number) {
        this.currentPrice = currentPrice
    }

    rebalance(price: number, targetQty: number): Order {
        if (targetQty > this.qty) {
            return {
                ticker: this.ticker,
                price,
                qty: targetQty - this.qty,
                side: SIDE.BUY,
                position: this
            }
        } else if (targetQty < this.qty) {
            return {
                ticker: this.ticker,
                price,
                qty: this.qty - targetQty,
                side: SIDE.SELL,
                position: this
            }
        } else {
            throw new Error("Rebalance called for equal target and held qty")
        }
    }

    sell(price: number): SellOrder {
        return {
            ticker: this.ticker,
            price,
            qty: this.qty,
            side: SIDE.SELL,
            position: this
        }
    }
}

export class Bettor {
    unallocated: number
    positions: Map<string, Position>

    constructor(
        captial: number,
        positions: Array<{ ticker: string, price: number, qty: number }>
    ) {
        this.unallocated = captial
        this.positions = new Map()
        positions.forEach(({ ticker, ...rest }) => {
            this.positions.set(ticker, new Position({ ticker, ...rest }))
        })
    }

    private get value() {
        let allocated = 0
        this.positions.forEach((position) => {
            allocated += position.qty * position.currentPrice
        })
        return {
            capital: this.unallocated + allocated,
            capitalAllocated: allocated,
            capitalUnallocated: this.unallocated
        }
    }

    private sizeBet(
        price: number,
        winrate: number,
        expectedLoss: number = 0.1,
        expectedWin: number = 0.1
    ): number {
        // const fraction = (winrate * expectedWin - (1 - winrate) * expectedLoss) / expectedWin;
        const fraction = 1
        const qty = Math.floor((this.value.capital * fraction) / price)
        if (qty < 0) throw new Error("Bet size smaller than 0")
        return qty
    }

    private place(order: Order): ITransaction {
        const orderValue = order.price * order.qty

        if (order.side === SIDE.BUY) {
            if (orderValue > this.unallocated) throw Error("Order value exceeds unallocated capital")
            this.unallocated -= orderValue
            const position = order.position
                ? order.position.add(order.price, order.qty)
                : new Position(order)
            this.positions.set(order.ticker, position)
        } else {
            this.unallocated += orderValue
            order.position.subtract(order.qty)
            this.positions.set(order.ticker, order.position)
        }


        return {
            ticker: order.ticker,
            price: order.price,
            qty: order.qty,
            side: order.side

        }
    }

    evaluate(
        ticker: string,
        price: number,
        predicted: string,
        probability: number,
        performance: { precision: number, recall: number }
    ): {
        capital: number,
        capitalAllocated: number,
        capitalUnallocated: number,
        transactions: Array<ITransaction>
    } {
        const position = this.positions.get(ticker)
        if (position !== undefined) position.setCurrentPrice(price)

        const transactions: Array<ITransaction> = []

        const qty = this.sizeBet(price, performance.precision, 0.1, 0.1)

        // TODO
        const side = /^BULL:\d/.test(predicted)
            ? SIDE.BUY
            : SIDE.SELL

        if (side === SIDE.BUY && (qty <= 0 || position?.qty === qty)) {
            return { ...this.value, transactions }
        }

        if (position === undefined && side === SIDE.BUY) {
            // Buy
            const order: BuyOrder = { ticker, price, qty, side: SIDE.BUY }
            const transaction = this.place(order)
            transactions.push(transaction)
        } else if (position !== undefined && side === SIDE.SELL) {
            // Sell
            const order = position.sell(price)
            const transaction = this.place(order)
            this.positions.delete(ticker)
            transactions.push(transaction)
        } else if (position !== undefined && side === SIDE.BUY) {
            // Rebalance
            const order = position.rebalance(price, qty)
            const transaction = this.place(order)
            transactions.push(transaction)
        } else {
            // Side sell & no position - do nothing.
        }

        //transactions.forEach((t) => {
        //    console.log(t)
        //})

        return { ...this.value, transactions }
    }
}

export class VariDiscrete {
    dis: Dis
    sum: Summary
    buf: Buffer<IBar>
    f: (bar: IBar, ctx: { buf: Buffer<IBar>, sum: Summary }) => number

    constructor(
        prefix: string,
        thres: Array<number>,
        length: number,
        getValue: (bar: IBar, ctx: { buf: Buffer<IBar>, sum: Summary }) => number
    ) {
        this.dis = new Dis(prefix, thres)
        this.sum = new Summary(length)
        this.buf = new Buffer(length)
        this.f = getValue
    }

    get labels() {
        return this.dis.labels
    }

    toDiscrete(bar: IBar) {
        this.buf.add(bar)
        const value = this.f(bar, { buf: this.buf, sum: this.sum })
        return this.dis.evaluate(value)
    }
}

export class Sim implements ISim {
    private tmx: TransitionMatrix
    private cmx: ConfusionMatrix
    private dis: Disc
    private bet: Bettor
    private tBuf: Buffer<Closed<string>>
    private cBuf: Buffer<Closed<string>>
    private transition?: Open<string>
    private prediction?: Open<string>
    // Test
    private discretizers: Array<VariDiscrete>

    constructor(
        tmx: TransitionMatrix,
        cmx: ConfusionMatrix,
        dis: Disc,
        bet: Bettor,
        tBuf: Buffer<Closed<string>>,
        cBuf: Buffer<Closed<string>>,
        discretizers: Array<VariDiscrete>
    ) {
        this.tmx = tmx
        this.cmx = cmx
        this.dis = dis
        this.bet = bet
        this.tBuf = tBuf
        this.cBuf = cBuf
        // Test
        this.discretizers = discretizers
    }

    static getLabels(discretizers: Array<VariDiscrete>) {
        const [first, ...rest] = discretizers.map((d) => d.labels)
        return rest.reduce(
            (a, labels) => a.flatMap((lhs) => labels.map((rhs) => `${lhs}::${rhs}`)),
            first
        )
    }

    next(ticker: string, bar: IBar): Step | undefined {
        // Testing new discretizer
        const state = this.discretizers.map((d) => d.toDiscrete(bar)).join("::")

        const {
            //state,
            trend,
            trendChange,
            trendVolume,
            trendLength,
            summary
        } = this.dis.eval(bar)

        // Open a new from-to transition pair
        this.transition = this.pair(
            this.transition,
            this.tBuf,
            this.tmx,
            state,
            state,
        )

        // Return if there's not enough data to make a prediciton
        if (this.tmx.sum < this.tBuf.size) return

        // Make a prediction
        const {
            predicted,
            probability,
        } = this.predict(state)

        // Open a new prediction-actual pair
        this.prediction = this.pair(
            this.prediction,
            this.cBuf,
            this.cmx,
            state,
            predicted
        )

        // Return if there's not enough data to assess performance
        if (this.cmx.sum < this.cBuf.size) return

        // Assess model performance
        const performance = this.cmx.micro()

        // Evaluate available data and maybe make a transaction
        const {
            capital,
            capitalAllocated,
            capitalUnallocated,
            transactions
        } = this.bet.evaluate(ticker, bar.c, predicted, probability, performance)

        // Return everything
        return {
            price: bar.c,
            summary,
            state,
            trend,
            trendChange,
            trendLength,
            trendVolume,
            capital,
            capitalAllocated,
            capitalUnallocated,
            transactions,
            predicted,
            probability,
            performance
        }
    }

    private pair(
        open: Open<string> | undefined,
        buf: Buffer<Closed<string>>,
        mx: TransitionMatrix | ConfusionMatrix,
        closeWith: string,
        openWith: string,
    ): Open<string> {
        // If there is an open par,
        // close it and increment / decfement the matrix
        if (open !== undefined) {
            const incr = open.close(closeWith)
            const decr = buf.add(incr)
            mx.increment(incr.lhs, incr.rhs)
            if (decr !== undefined) {
                mx.decrement(decr.lhs, decr.rhs)
            }
        }
        // Return a new open pair
        return new Open(openWith)
    }

    private predict(from: string): IPrediction {
        const [
            predicted,
            probability
        ] = this.tmx
            .next(from)
            .sort((a, b) => b[1] - a[1])[0]

        return { predicted, probability }
    }
}