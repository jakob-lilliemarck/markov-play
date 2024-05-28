import { Matrix, type Square } from "./matrix"

/**
 * Multiclass confusion matrix. Predicted values on the x-axis actuals on the y-axis.
 */
export class ConfusionMatrix {
    matrix: Matrix

    constructor(dto?: Square) {
        this.matrix = Matrix.square(dto)
    }

    get sum() {
        return this.matrix.sum
    }

    get classes(): Array<string> {
        return this.matrix.xLabels
    }

    get value() {
        return this.matrix.value
    }

    increment(actual: string, predicted: string) {
        return this.matrix.increment(actual, predicted)
    }

    decrement(actual: string, predicted: string) {
        this.matrix.decrement(actual, predicted)
    }

    /**
     * True positives for a single class, accessed by index
     * @param index The index of the class to examine
     * @returns The number of true positives
     */
    tp(index: number): number {
        return this.matrix.valAt(index, index)
    }

    /**
     * False negatives for a single class, accessed by index
     * @param index The index of the class to examine
     * @returns Number of false negatives
     */
    fn(index: number): number {
        const row = this.matrix.rowAt(index)
        return row.reduce((a, value, x) => {
            return index !== x
                ? a + value
                : a
        }, 0)
    }

    /**
     * False positives for a single class, accessed by index
     * @param index The index of the class to examine
     * @returns Number of false positives
     */
    fp(index: number): number {
        const col = this.matrix.colAt(index)
        return col.reduce((a, value, y) => {
            return index !== y
                ? a + value
                : a
        }, 0)
    }

    /**
     * True negatives for a single class, accessed by index
     * @param index The index of the class to examine
     * @returns Number of true negatives
     */
    tn(index: number): number {
        return this.matrix.value.reduce((a, row, y) => {
            return index !== y
                ? a + row.reduce((b, value, x) => {
                    return index !== x
                        ? b + value
                        : b
                }, 0)
                : a
        }, 0)
    }

    /**
     * Compute the precision for a single class, accessed by index.
     * @param index The index of the class to examine
     * @returns The precision for this class 
     */
    precision(index: number): number {
        const tp = this.tp(index)
        const fp = this.fp(index)
        return tp / (tp + fp)
    }

    /**
     * Compute the recall for a single class, accessed by index.
     * @param index The index of the class to examine
     * @returns The The recall for this class
     */
    recall(index: number): number {
        const tp = this.tp(index)
        const fn = this.fn(index)
        return tp / (tp + fn)
    }

    /**
     * @returns The accuracy of this matrix
     */
    accuracy(): number {
        return this.matrix.value.reduce((a, _, i) => a + this.tp(i), 0) / this.matrix.sum
    }

    /**
     * Average recall and precision across all classes
     * @returns The macro average precision and recall of this matrix
     */
    macro() {
        const r = this.matrix.value.reduce((a, _, i) => a + this.recall(i), 0)
        const p = this.matrix.value.reduce((a, _, i) => a + this.precision(i), 0)
        const n = this.matrix.value.length

        return {
            recall: r / n,
            precision: p / n
        }
    }

    /**
     * Micro average differs from macro average in that it's weighted by actuals.
     * That means that less likely wrongful predictions will have less impact than more frequent ones.
     * @returns The micro average precision and recall of this matrix
     */
    micro() {
        const tp = this.matrix.value.reduce((a, _, i) => a + this.tp(i), 0)
        const fn = this.matrix.value.reduce((a, _, i) => a + this.fn(i), 0)
        const fp = this.matrix.value.reduce((a, _, i) => a + this.fp(i), 0)
        return {
            recall: tp / (tp + fn),
            precision: tp / (tp + fp)
        }
    }
}