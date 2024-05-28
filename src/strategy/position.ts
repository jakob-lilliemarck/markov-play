import { Transaction } from "./transaction"

export class Position {
    ticker: string
    price: number
    qty: number
    type: "LONG" | "SHORT"

    constructor(
        ticker: string,
        price: number,
        qty: number,
        type: "LONG" | "SHORT"
    ) {
        this.ticker = ticker
        this.price = price
        this.qty = qty
        this.type = type
    }

    get value() {
        return this.price * this.qty
    }

    rebalance(price: number, qtyTarget: number, time: number): [Transaction, Position] {
        let p: undefined | Position
        let t: undefined | Transaction

        const priceDelta = price - this.price
        const qtyDelta = qtyTarget - this.qty

        if (qtyDelta < 0 && this.type === "SHORT") {
            const shortPrice = this.price - priceDelta
            t = new Transaction(
                this.ticker,
                shortPrice,
                time,
                qtyDelta,
                this.type
            )
            p = new Position(
                this.ticker,
                shortPrice,
                qtyTarget,
                this.type
            )
        } else {
            t = new Transaction(
                this.ticker,
                price,
                time,
                qtyDelta,
                this.type
            )
            p = new Position(
                this.ticker,
                price,
                qtyTarget,
                this.type
            )
        }

        return [t, p]
    }

    sell(price: number, time: number): Transaction {
        return new Transaction(
            this.ticker,
            price,
            time,
            -this.qty,
            this.type,
        )
    }
}