import { csvToRows } from './utils'
import { toAnnotated, type Row, type Annotated } from './simple'
import { transitionMatrix } from './simple'
import { sign } from 'crypto'
import { dir } from 'console'

const SAMPLE_CSV = './sample_msft.csv'

interface Account {
    qty: number,
    price: number, // the avg price of held positions
    cash: number
}

const trade = (action: 'buy' | 'sell', price: number, qty: number, account: Account) => {
    const value = price * qty
    if (action === 'buy' && account.cash >= value) {
        return {
            qty: account.qty + qty,
            price: (account.price * account.qty) + value / (account.qty + qty),
            cash: account.cash - value
        }
    }
    if (action === 'sell' && account.qty >= qty) {
        return {
            qty: account.qty - qty,
            price: account.qty - qty === 0 ? 0 : account.price,
            cash: account.cash + value
        }
    }
    return account
}

const rows = csvToRows<Row>(SAMPLE_CSV)


const signal = (group: number, thres = 4) => {
    return transitionMatrix[group].reduce((a, e, i) => {
        return i > thres
            ? { ...a, upside: a.upside + e }
            : i < thres
                ? { ...a, downside: a.downside + e }
                : { ...a, stagnant: a.stagnant + e }
    }, { upside: 0, downside: 0, stagnant: 0 })
}

let account = {
    qty: 0,
    price: 0,
    cash: 10000,
}

const getValue = (row: Annotated, account: Account) => {
    return (parseFloat(row.close) * account.qty) + account.cash
}

const result = rows.reduceRight((a, row, i, arr) => {
    i
    const annotated = toAnnotated(row, a.at(a.length - 1)?.annotated)
    if (annotated.group) {
        const { upside, downside } = signal(annotated.group)
        if (upside > downside) {
            console.log('buy')
            account = trade('buy', parseFloat(annotated.close), 1, account)
            console.log(account)
        }
        if (downside > upside) {
            console.log('sell')
            account = trade('sell', parseFloat(annotated.close), 1, account)
            console.log(account)
        }
        //const value = getValue(annotated, account)
        //console.log(annotated.date, account, 'value ', value)
    }
    return [...a, { annotated, account, value: getValue(annotated, account) }]
}, [] as Array<{ account: Account, annotated: Annotated, value: number }>)


/// ---

type Direction = 'buy' | 'sell'

class Order {
    private _price: number
    private _qty: number
    private _date: string
    private _direction: Direction
    private _transaction?: Transaction

    constructor(direction: Direction, price: number, qty: number, date: string) {
        this._price = price
        this._qty = qty
        this._date = date
        this._direction = direction
        this._transaction = undefined
    }

    transact() {
        if (!this._transaction) {
            this._transaction = new Transaction(this)
        }
        return this._transaction
    }

    get direction() {
        return this._direction
    }

    get price() {
        return this._price
    }

    get qty() {
        return this._qty
    }

    get value() {
        return this._qty * this._price
    }
}

class Transaction {
    private _price: number
    private _qty: number

    constructor(order: Order) {
        this._price = order.price
        this._qty = order.direction === 'sell' ? -order.qty : order.qty
    }

    get price() {
        return this._price
    }

    get qty() {
        return this._qty
    }

    get value() {
        return this._qty * this._price
    }
}

class Portfolio {
    private _initial: number
    private _cash: number
    private _qty: number
    private _orders: Order[]

    constructor(cash: number) {
        this._initial = cash
        this._cash = cash
        this._qty = 0
        this._orders = []
    }

    private isValidOrder(order: Order) {
        return (order.direction === 'buy' && order.value < this._cash) || (order.direction === 'sell' && order.qty < this._qty)
    }

    order(order: Order) {
        if (this.isValidOrder(order)) {
            const transaction = order.transact()
            this._qty + transaction.qty
            this._cash + transaction.value
            this._orders.push(order)
        }
    }

    get change() {
        return this._cash / this._initial
    }
}

export type Strategy<T extends Row> = {
    evaluate(event: T): Order | null
}

class Simuation<T extends Row> {
    portfolio: Portfolio
    events: T[]

    constructor(cash: number, events: T[]) {
        this.portfolio = new Portfolio(cash)
        this.events = events.toSorted((a, b) => a.date.localeCompare(b.date)) // sort ascending order, latest date last
    }

    get perfBuyHold() {
        const first = this.events[0]
        const last = this.events[this.events.length - 1]
        return parseFloat(first.close) / parseFloat(last.close)
    }

    calculate(strategy: Strategy<T>) {
        this.events.forEach((e) => {
            const order = strategy.evaluate(e)
            if (order) {
                this.portfolio.order(order)
            }
        })
    }
}