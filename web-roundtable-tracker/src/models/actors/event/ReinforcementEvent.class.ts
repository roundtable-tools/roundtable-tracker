import { UUID } from "@/utils/uuid";
import { EventProps, Event } from "./Event.class";

export interface ReinforcementEventProps extends EventProps {
    reinforcementParticipantIds: UUID[];
}

export class ReinforcementEvent extends Event {
    private _reinforcementParticipantIds: UUID[];
    pauseLabel = "Disable event";
    resumeLabel = "Re-enable event";
    startLabel = "Trigger now";
    stopLabel = "Revert changes";
    actLabel = "End round";
    begin() {
        // begin the event
        //TODO: trigger resume on all participants
    }
    constructor(props: ReinforcementEventProps) {
        super(props);
        this._reinforcementParticipantIds = props.reinforcementParticipantIds;
    }
    get reinforcementParticipantIds(): UUID[] {
        return this._reinforcementParticipantIds;
    }
}