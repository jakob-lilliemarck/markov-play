import { Matrix, type Asymetric } from "./matrix"

/**
 * Hidden states along the y-axis
 * Emitted states along the x-axis
 */
export class EmissionMatrix {
    matrix: Matrix

    constructor(dto?: Asymetric) {
        this.matrix = Matrix.asymetric(dto)
    }

    get value(): Array<Array<number>> {
        return this.matrix.value
    }

    stochastic() {
        return this.matrix.stochastic()
    }

    valAt(emitted: number, hidden: number): number {
        return this.matrix.valAt(emitted, hidden)
    }

    emittedIndexOf(emitted: string): number {
        return this.matrix.xIndexOf(emitted)
    }

    hiddenIndexOf(hidden: string): number {
        return this.matrix.yIndexOf(hidden)
    }

    increment(hidden: string, emitted: string): [number, number] {
        return this.matrix.increment(emitted, hidden)
    }
}
