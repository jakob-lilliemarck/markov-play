export class Discrete {
    side: "U" | "N" | "D"
    size: number

    private constructor(side: "U" | "N" | "D", size: number) {
        this.side = side
        this.size = size
    }

    get str() {
        return `${this.side}${this.size}`
    }

    static fromChange(change: number): Discrete {
        const side = change === 0 ? "N" : change > 0 ? "U" : "D"
        const size = Discrete.getSize(change, [0, 0.5, 1.0])
        return new Discrete(side, size)
    }

    static fromString(str: string): Discrete {
        const side = str.at(0)
        const size = str.at(1)
        if (!(side === "U" || side === "N" || side === "D")) throw new Error("")
        if (size === undefined) throw new Error("")
        return new Discrete(side, parseInt(size, 10))
    }

    private static getSize(change: number, thres: Array<number>) {
        return thres.reduce(
            (a, t, i) => {
                return Math.abs(change) > t ? i + 1 : a
            }, 0
        )
    }
}