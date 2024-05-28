export interface MatrixDTO {
    value: Array<Array<number>>,
    labels: [Array<string>, Array<string>],
    type: 'square' | 'asymetric'
}

// TODO - use these and make the constructor private
export interface Square {
    value: Array<Array<number>>,
    labels: Array<string>,
}

export interface Asymetric {
    value: Array<Array<number>>,
    labels: [Array<string>, Array<string>],
}

/**
 * A basic matrix. Rows on the y-axis, columns on the x-axis.
 */
export class Matrix {
    value: Array<Array<number>>
    y: Map<string, number>
    x: Map<string, number>
    yi: Map<number, string>
    xi: Map<number, string>
    sum: number
    type: string

    constructor(dto: MatrixDTO) {
        this.value = dto ? dto.value : []
        this.y = new Map<string, number>
        this.x = new Map<string, number>
        this.yi = new Map<number, string>
        this.xi = new Map<number, string>
        this.sum = this.value.flat().reduce((a, value) => a + value, 0)
        this.type = dto.type

        dto.labels[1].forEach((state, i) => {
            this.y.set(state, i)
            this.yi.set(i, state)
        })
        dto.labels[0].forEach((state, i) => {
            this.x.set(state, i)
            this.xi.set(i, state)
        })
    }

    get isSquare() {
        return this.type === 'square'
    }

    get yLabels(): Array<string> {
        return Array.from(this.y.keys())
    }

    get xLabels(): Array<string> {
        return Array.from(this.x.keys())
    }

    get xIndices(): Array<number> {
        return Array.from(this.x.values())
    }

    get yIndices(): Array<number> {
        return Array.from(this.y.values())
    }

    stochastic() {
        return this.value.map((row) => {
            const sum = row.reduce((a, e) => a + e, 0)
            return row.map((e, _i, arr) => sum > 0 ? e / sum : 1 / arr.length)
        })
    }

    rowAt(y: number, stochastic = false): Array<number> {
        const row = this.value[y]
        if (row === undefined) {
            throw Matrix.errAccessUndefinedRow(y)
        }
        if (stochastic) {
            const sum = row.reduce((a, e) => a + e, 0)
            return row.map((e) => sum > 0 ? e / sum : e / row.length)
        }
        return row
    }

    colAt(x: number): Array<number> {
        return this.value.map((row) => {
            const value = row[x]
            if (value === undefined) {
                throw Matrix.errAccessUndefinedColumn(x)
            }
            return value
        })
    }

    xIndexOf(label: string) {
        const i = this.x.get(label)
        if (i === undefined) {
            throw Matrix.errAccessUndefinedColumn(label)
        }
        return i
    }

    yIndexOf(label: string) {
        const i = this.y.get(label)
        if (i === undefined) {
            throw Matrix.errAccessUndefinedRow(label)
        }
        return i
    }

    xLabelOf(i: number): string {
        const label = this.xi.get(i)
        if (label === undefined) {
            throw Matrix.errAccessUndefinedColumn(i)
        }
        return label
    }

    yLabelOf(i: number): string {
        const label = this.yi.get(i)
        if (label === undefined) {
            throw Matrix.errAccessUndefinedColumn(i)
        }
        return label
    }

    valAt(x: number, y: number): number {
        const row = this.rowAt(y)
        const value = row[x]
        if (value === undefined) {
            throw Matrix.errAccessUndefinedColumn(x)
        }
        return value
    }

    yAdd(label: string): number {
        if (this.y.has(label)) {
            throw Matrix.errRowExist(label)
        }
        const i = this.value.length
        const len = this.value[0] ? this.value[0].length : 0
        this.value.push(Array(len).fill(0))
        this.y.set(label, i)
        this.yi.set(i, label)
        return i
    }

    xAdd(label: string): number {
        if (this.x.has(label)) {
            throw Matrix.errColExist(label)
        }
        const i = this.value[0] !== undefined ? this.value[0].length : 0
        this.value.forEach((row) => row.push(0))
        this.x.set(label, i)
        this.xi.set(i, label)
        return i
    }

    getOrAdd(label: string, axis: "x" | "y"): number {
        switch (axis) {
            case "x":
                return this.x.get(label) ?? this.xAdd(label)
            case "y":
                return this.y.get(label) ?? this.yAdd(label)
            default:
                throw Matrix.errInvalidAxis(axis)
        }
    }

    increment(x: string, y: string): [number, number] {
        const yi = this.getOrAdd(y, "y")
        if (this.isSquare) this.getOrAdd(x, "y")
        if (this.isSquare) this.getOrAdd(y, "x")
        const xi = this.getOrAdd(x, "x")

        this.value[yi][xi] += 1
        this.sum += 1
        return [xi, yi]
    }

    decrement(x: string, y: string): [number, number] {
        const yi = this.y.get(y)
        const xi = this.x.get(x)
        if (yi === undefined) throw Matrix.errAccessUndefinedRow(y)
        if (xi === undefined) throw Matrix.errAccessUndefinedColumn(x)
        this.value[yi][xi] -= 1
        this.sum -= 1
        return [xi, yi]
    }

    private static dtoFromAsymetric(dto?: Asymetric): MatrixDTO {
        return {
            value: dto ? dto.value : [],
            labels: dto ? dto.labels : [[], []],
            type: 'asymetric'
        }
    }

    private static dtoFromSquare(dto?: Square): MatrixDTO {
        return {
            value: dto ? dto.value : [],
            labels: dto ? [dto.labels, dto.labels] : [[], []],
            type: 'square'
        }
    }

    static square(dto?: Square) {
        const square = Matrix.dtoFromSquare(dto)
        Matrix.guardSquare(square)
        Matrix.guardClassCount(square)
        Matrix.guardClassOrder(square)
        return new Matrix(square)
    }

    static asymetric(dto?: Asymetric) {
        const asymetric = Matrix.dtoFromAsymetric(dto)
        Matrix.guardClassCount(asymetric)
        return new Matrix(asymetric)
    }

    private static errAccessUndefinedRow(y: number | string) {
        return new Error(`ERROR: Accessed undefined matrix row "y:${y}"`)
    }

    private static errAccessUndefinedColumn(x: number | string) {
        return new Error(`ERROR: Accessed undefined matrix column "x:${x}`)
    }

    private static errColExist(label: string) {
        return new Error(`ERROR:  X-axis label "${label}" already exists`)
    }

    private static errRowExist(label: string) {
        return new Error(`ERROR: Y-axis "${label}" already exists`)
    }

    private static errInvalidAxis(axis: "x" | "y") {
        return new Error(`ERROR: Invalid axis "${axis}". Axis must any of "x" | "y"`)
    }

    private static guardSquare(dto: MatrixDTO) {
        const y = dto.value.length === dto.labels[1].length
        const x = dto.value[0] === undefined || dto.value[0].length === dto.labels[0].length
        const xy = dto.value[0] === undefined || dto.value[0].length === dto.value.length
        if (!(x && y && xy)) {
            throw new Error(`ERROR: x- and y-axis have different lengths`)
        }
    }

    private static guardClassOrder(dto: MatrixDTO) {
        if (dto.labels[1].reduce((a, label, i) => a ? true : label !== dto.labels[0][i], false)) {
            throw new Error(`ERROR: x- and y-axis labels are non identical `)
        }
    }

    private static guardClassCount(dto: MatrixDTO) {
        if (dto.labels[1].length !== dto.value.length) {
            throw new Error(`ERROR: the number of rows and row labels do not match`)
        }

        if (dto.labels[0].length !== 0 && dto.value && dto.value[0].length !== 0 && dto.labels[0].length !== dto.value[0].length) {
            throw new Error(`ERROR: the number of columns and column labels do not match`)
        }
    }
}
