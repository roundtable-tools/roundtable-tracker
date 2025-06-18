import { Condition } from "@/models/utility/condition/Condition.class";
import { Actor, ActorProps } from "../Actor.class";

export interface ConditionEventProps extends ActorProps {
    condition: Condition;
}

export class ConditionEvent extends Actor  {
    private _condition: Condition;
    private _name?: string;
    pauseLabel = "Disable event";
    resumeLabel = "Re-enable event";
    startLabel = "Trigger now";
    stopLabel = "Revert changes";
    beginLabel = "Begin round";
    endLabel = "End round";
    pause() { // Disable event
        
    }
    resume() { // Re-enable event

    }
    start() { // Trigger now

    }
    stop() { // Revert changes

    }
    act() { // End round action

    }
 
    constructor(props: ConditionEventProps) {
        super(props);
        this._condition = props.condition;
        this._name = props.name;
    }
    get condition(): Condition {
        return this._condition;
    }
    get name(): string {
        return this._name || "Condition Event";
    }
}