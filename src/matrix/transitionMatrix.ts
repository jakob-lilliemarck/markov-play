import { Matrix as MLMatrix, EigenvalueDecomposition } from 'ml-matrix';
import { Matrix, type Square } from './matrix'

/**
 * Transition matrix
 * Transitioned from states along the y-axis
 * Transitioned to states along the x-axis
 */
export class TransitionMatrix {
    matrix: Matrix

    constructor(dto?: Square) {
        this.matrix = Matrix.square(dto)
    }

    get value(): Array<Array<number>> {
        return this.matrix.value
    }

    get indices(): Array<number> {
        return this.matrix.xIndices
    }

    get classes(): Array<string> {
        return this.matrix.xLabels
    }

    get sum() {
        return this.matrix.sum
    }

    stochastic() {
        return this.matrix.stochastic()
    }

    increment(from: string, to: string): [number, number] {
        return this.matrix.increment(to, from)
    }

    decrement(from: string, to: string): [number, number] {
        return this.matrix.decrement(to, from)
    }

    valAt(to: number, from: number): number {
        return this.matrix.valAt(to, from)
    }

    /**
     * Return the next state probabilities for an observed state. 
     * @param from The state to transition from 
     * @returns probabilities for next state transition
     */
    next(from: string): Array<[string, number]> {
        const yi = this.matrix.yIndexOf(from)
        const row = this.matrix.rowAt(yi, true)
        return row.map((p, i) => [
            this.matrix.xLabelOf(i),
            p,
        ])
    }

    /**
     * Compute the stationary distributions of this transition matrix.
     * Note that there may be multiple stationary distributions.
     * @param tolerance Tolerance used to evaluate which eigenvalues correspond to  a valid stationary distribution
     * @returns Array of Array of strings representing fixed decimal floating point numbers. Each row is a valid stationary distribution
     */
    pi(tolerance: number = 1e-10) {
        const matrix = new MLMatrix(this.stochastic())
        const eig = new EigenvalueDecomposition(matrix.transpose())
        return eig.realEigenvalues.reduce((a, eigenvalue, i) => {
            // Find all eigenvalues that are within tolerance of 1
            if (Math.abs(eigenvalue - 1) < tolerance) {
                const vec = eig.eigenvectorMatrix.getColumn(i)
                const sum = vec.reduce((a, e) => a + e, 0)
                return [...a, vec.map((e) => (e / sum))]
            } else {
                return a
            }
        }, [] as Array<Array<number>>)
    }
}
