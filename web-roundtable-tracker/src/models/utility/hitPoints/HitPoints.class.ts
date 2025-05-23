export class HitPoints {
    private _current: number;
    private _max: number;
    private _temp: number;

    constructor(max: number) {
        this._max = max;
        this._current = max;
        this._temp = 0;
    }

    get current(): number {
        return this._current + this._temp;
    }

    get max(): number {
        return this._max + this._temp;
    }

    get temp(): number {
        return this._temp;
    }

    set temp(value: number) {
        this._temp = value;
    }

    set current(value: number) {
        this._current = value - this._temp;
    }
}