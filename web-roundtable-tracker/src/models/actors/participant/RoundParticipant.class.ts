import { EncounterSlot } from "@/models/encounters/EncounterSlot.class";
import { Actor, ActorProps } from "../Actor.class";

export interface RoundParticipantProps extends ActorProps {
    currentRound?: number;
    encounterSlot?: EncounterSlot;
    name?: string;
}

export interface RoundTimer {
    currentRound: number;
    currentRoundTimestamp?: number;
    roundDurations: number[];
}

// Event that stores and triggers other events at the end of the round
export class RoundParticipant extends Actor implements RoundTimer {
    private _currentRound: number;
    private _encounterSlot?: EncounterSlot;
    private _name?: string;
    currentRoundTimestamp?: number;
    roundDurations: number[];
    beginLabel = "End current round";
    endLabel = "Start new round";
    begin() { // End current round action
    }
    end() { // Start new round action
    }
    constructor(props: RoundParticipantProps) {
        super(props);
        this._currentRound = props.currentRound ?? 0;
        this._encounterSlot = props.encounterSlot;
        this._name = props.name;
        this.currentRoundTimestamp = undefined;
        this.roundDurations = [];
    }
    get currentRound(): number {
        return this._currentRound;
    }
    get encounterSlot(): EncounterSlot | undefined {
        return this._encounterSlot;
    }
    get name(): string {
        return this._name ?? this._encounterSlot?.name ?? "Creature";
    }
    set name(name: string) {
        this._name = name;
    }
}