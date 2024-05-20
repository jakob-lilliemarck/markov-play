import { Callback, Row } from './model'

export class Composed<T extends Row, U extends T> {
    fns: Array<Callback<T, U>>;

    constructor(fns: Array<Callback<T, U>> = []) {
        this.fns = fns;
    }

    // Method to append a new function to the composition
    append<R extends T>(fn: Callback<T, R>): Composed<T, R & U> {
        return new Composed<T, U & R>([...this.fns, fn] as Array<Callback<T, U & R>>);
    }

    eval(arr: Array<T>) {
        return arr.map((e, i, a) => this.fns.reduceRight((acc, fn) => {
            const r = fn(acc, i, a) as U
            return r
        }, e)) as Array<U>
    }
}