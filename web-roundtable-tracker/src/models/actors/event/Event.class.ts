import { Actor, ActorProps } from "../Actor.class";

export interface EventProps extends ActorProps {
    description: string;
    round: number;
}

export class Event extends Actor  {
    private _description: string;
    private _round: number;
    private _name?: string;
    pauseLabel = "Disable event";
    resumeLabel = "Re-enable event";
    startLabel = "Trigger now";
    stopLabel = "Revert changes";
    beginLabel = "Begin round";
    endLabel = "End round";
    pause() { // Disable event
        // disable the event trigger
    }
    resume() { // Re-enable event
        // re-enable the event trigger
    }
    start() { // Trigger now
        // trigger the event immediately
    }
    stop() { // Revert changes
        // revert the event to its original state
    }
    begin() {
        // begin the event
    }
    end() {
        // end the event
    }
    constructor(props: EventProps) {
        super(props);
        this._description = props.description;
        this._round = props.round;
        this._name = props.name
    }
    get description(): string {
        return this._description;
    }
    get round(): number {
        return this._round;
    }
    get name(): string {
        return this._name || "Event";
    }
}