import { Position } from "./position"
import { Transaction } from "./transaction"
import { type Assessment } from "./assessor"
import type { Prediction } from "./predictor"
import { Bar } from "./bar"

interface IBettor {
    capital: number
    allocated?: number
    positions?: Map<string, Position>
}

export class Bettor {
    capital: number
    allocated: number
    positions: Map<string, Position>

    constructor({ capital, allocated, positions }: IBettor) {
        this.capital = capital
        this.allocated = allocated ?? 0
        this.positions = positions ?? new Map()
    }

    private get unallocated() {
        return this.capital - this.allocated
    }

    private static isBetterThanRandom(prediction: Prediction, assessment: Assessment): boolean {
        return assessment.precision > 0.55 && assessment.recall > 0.50 && assessment.winrate > 0.55
    }

    bet({ actual, prediction, assessment }: { actual: Bar, prediction: Prediction, assessment: Assessment }) {
        const position = this.positions.get(actual.ticker)
        const transactions = []

        // Opt out and don't bet on worse than random
        if (!Bettor.isBetterThanRandom(prediction, assessment)) {
            if (position !== undefined) {
                const t = position.sell(actual.close, actual.time)
                this.capital += t.value
                this.positions.delete(actual.ticker)
                transactions.push(t)
            }
            return transactions
        }

        // Target values
        const fraction = Bettor.getBetSize(assessment)
        const type = Bettor.getType(prediction)

        if (position !== undefined && position.type === type) {
            // Rebalance an existing position
            const qty = Bettor.getCappedValue(position.qty, Math.floor(fraction * this.capital / actual.close))
            const [t, p] = position.rebalance(actual.close, qty, actual.time)
            this.capital += t.value
            this.positions.set(actual.ticker, p)
            transactions.push(t)
            return transactions
        }

        if (position !== undefined && position.type !== type) {
            // Sell a whole existing position
            const t = position.sell(actual.close, actual.time)
            this.capital += t.value
            this.positions.delete(actual.ticker)
            transactions.push(t)
        }

        if (type !== undefined) {
            // Buy a new position
            const qty = Math.floor(Bettor.getCappedValue(this.unallocated, fraction * this.capital) / actual.close)
            const t = new Transaction(actual.ticker, actual.close, actual.time, qty, type)
            const p = new Position(actual.ticker, actual.close, qty, type)
            this.capital += t.value
            this.positions.set(actual.ticker, p)
            transactions.push(t)
        }

        return transactions
    }

    private static getCappedValue(cap: number, value: number) {
        return cap - value > 0 ? value : cap
    }

    /**
     * Source "Investment formula" at https://en.wikipedia.org/wiki/Kelly_criterion
     */
    private static getBetSize({ winrate }: Assessment, expectedLoss = 0.10, expectedWin = 0.20) {
        return winrate / expectedLoss - (1 - winrate) / expectedWin
    }

    private static getType({ discrete }: Prediction): undefined | "SHORT" | "LONG" {
        if (discrete.side === "D") return "SHORT"
        if (discrete.side === "U") return "LONG"
    }
}