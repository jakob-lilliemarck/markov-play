export class Buffer<T> {
    size: number
    value: Array<T>

    constructor(size: number) {
        this.size = size
        this.value = []
    }

    add(increment: T): undefined | T {
        let decrement: undefined | T;

        this.value.unshift(increment)

        if (this.value.length > this.size) {
            decrement = this.value.pop()
        }

        return decrement
    }

    aggregate<U>(f: (buffer: Array<T>) => U): undefined | U {
        if (this.saturated) {
            return f(this.value)
        }
    }

    get saturated() {
        return this.size === this.value.length
    }

    get length() {
        return this.value.length
    }

    get last(): undefined | T {
        return this.value[-1]
    }
}