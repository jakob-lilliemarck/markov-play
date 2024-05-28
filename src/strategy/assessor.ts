import { Discrete } from "./discrete"
import { Buffer } from "./buffer"
import { ConfusionMatrix } from "../matrix/confusionMatrix"
import { Closed } from "./closed"
import { Open } from "./open"

export interface Assessment {
    winrate: number
    precision: number
    recall: number
}

export class Assessor {
    openPrediction?: Open<Discrete>
    predictions: Buffer<Closed<Discrete>>
    mxConfusion: ConfusionMatrix
    size: number
    wins: number

    constructor(size: number) {
        this.predictions = new Buffer(size)
        this.mxConfusion = new ConfusionMatrix()
        this.size = size
        this.wins = 0
    }

    get winrate() {
        return this.wins / this.size
    }

    private countWin(pair: Closed<Discrete>, pos: boolean) {
        if (pair.lhs.side === pair.rhs.side) {
            this.wins += pos ? 1 : -1
        }
    }

    assess(
        actual: { discrete: Discrete },
        predicted: { discrete: Discrete }
    ): undefined | Assessment {
        if (this.openPrediction !== undefined) {
            const incr = this.openPrediction.close(actual.discrete)
            const decr = this.predictions.add(incr)

            this.mxConfusion.increment(incr.lhs.str, incr.rhs.str)
            this.countWin(incr, true)

            if (decr !== undefined) {
                this.mxConfusion.decrement(decr.lhs.str, decr.rhs.str)
                this.countWin(decr, false)
            }
        }

        this.openPrediction = new Open(predicted.discrete)

        if (!this.predictions.saturated) return

        const winrate = this.wins / this.size
        const { precision, recall } = this.mxConfusion.micro()

        return {
            winrate,
            precision,
            recall
        }
    }
}