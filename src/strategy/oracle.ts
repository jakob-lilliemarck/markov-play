import { Assessor, type Assessment } from "./assessor";
import { Predictor, type Prediction } from "./predictor";
import { Bar } from "./bar"

export class Oracle {
    ticker: string
    predictor: Predictor
    assessor: Assessor

    constructor(ticker: string, size: number) {
        this.ticker = ticker
        this.predictor = new Predictor(size)
        this.assessor = new Assessor(size)
    }

    ask(actual: Bar) {
        const prediction = this.predictor.predict(actual)

        if (prediction === undefined) return
        const assessment = this.assessor.assess(actual, prediction)

        if (assessment === undefined) return

        return {
            prediction,
            assessment,
            actual
        }
    }
}