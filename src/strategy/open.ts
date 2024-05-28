import { Closed } from './closed'

export class Open<T> {
    lhs: T

    constructor(lhs: T) {
        this.lhs = lhs
    }

    close(rhs: T): Closed<T> {
        return new Closed(this.lhs, rhs)
    }
}