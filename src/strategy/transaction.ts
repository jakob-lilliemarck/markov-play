export class Transaction {
    ticker: string
    price: number
    qty: number
    type: "LONG" | "SHORT"

    constructor(
        ticker: string,
        price: number,
        qty: number,
        type: "LONG" | "SHORT",
    ) {
        this.ticker = ticker
        this.price = price
        this.qty = qty
        this.type = type
    }

    get value() {
        return this.qty * -this.price
    }
}