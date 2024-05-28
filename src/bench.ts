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

export type Strategy<T> = {
    evaluate(event: T): Order | null
}

class Simuation<T> {
    portfolio: Portfolio
    events: T[]

    constructor(cash: number, events: T[]) {
        this.portfolio = new Portfolio(cash)
        this.events = events
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