
export class Coordinate {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) { }

    static fromString(key: string): Coordinate {
        const [x, y] = key.split(',').map(Number);
        return new Coordinate(x, y);
    }

    toString(): string {
        return `${this.x},${this.y}`;
    }

    equals(other: Coordinate): boolean {
        return this.x === other.x && this.y === other.y;
    }

    distanceTo(other: Coordinate): number {
        return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y));
    }

    isValid(size: number = 8): boolean {
        return this.x >= 0 && this.x < size && this.y >= 0 && this.y < size;
    }
}
