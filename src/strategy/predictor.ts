import { TransitionMatrix } from "../matrix/transitionMatrix"
import { Closed } from "./closed"
import { Open } from "./open"
import { Discrete } from "./discrete"
import { Buffer } from "./buffer"
import { Bar } from "./bar"
import { Discretizer } from "model/model"

export interface Prediction {
    discrete: Discrete
    probability: number
}

export class Predictor {
    openTransition?: Open<Bar>
    transitions: Buffer<Closed<Bar>>
    mxTransition: TransitionMatrix

    constructor(size: number) {
        this.transitions = new Buffer(size)
        this.mxTransition = new TransitionMatrix({
            value: [
                [0, 0, 0,],
                [0, 0, 0,],
                [0, 0, 0,],
            ],
            labels: ["U1", "N0", "D1",]
        })
    }

    predict(bar: Bar): undefined | Prediction {
        if (this.openTransition !== undefined) {
            const incr = this.openTransition.close(bar)
            const decr = this.transitions.add(incr)
            this.mxTransition.increment(incr.lhs.discrete.str, incr.rhs.discrete.str)
            if (decr !== undefined) this.mxTransition.decrement(decr.lhs.discrete.str, decr.rhs.discrete.str)
        }

        this.openTransition = new Open(bar)

        if (!this.transitions.saturated) return

        const [discrete, probability] = this.mxTransition.next(bar.discrete.str).sort((a, b) => b[1] - a[1])[0]

        return {
            discrete: Discrete.fromString(discrete),
            probability
        }
    }
}