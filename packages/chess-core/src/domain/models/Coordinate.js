"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinate = void 0;
class Coordinate {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static fromString(key) {
        const [x, y] = key.split(',').map(Number);
        return new Coordinate(x, y);
    }
    toString() {
        return `${this.x},${this.y}`;
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}
exports.Coordinate = Coordinate;
