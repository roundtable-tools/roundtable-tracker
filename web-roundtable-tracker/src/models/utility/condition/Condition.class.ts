export class Condition {
    private _name: string;
    private _description: string;
    private _duration: number;
    private _isActive: boolean;

    constructor(name: string, description: string, duration: number) {
        this._name = name;
        this._description = description;
        this._duration = duration;
        this._isActive = true;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get duration(): number {
        return this._duration;
    }

    get isActive(): boolean {
        return this._isActive;
    }
}