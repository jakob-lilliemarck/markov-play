export class Closed<T> {
    lhs: T
    rhs: T

    constructor(lhs: T, rhs: T) {
        this.lhs = lhs
        this.rhs = rhs
    }

    toTuple(): [T, T] {
        return [this.lhs, this.rhs]
    }
}