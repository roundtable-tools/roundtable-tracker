import { Command } from "@/CommandHistory/common";
import { Encounter } from "../encounters/Encounter.class";
import { InitiativeParticipant } from "./InitiativeParticipant.class";
import { zip } from "@/utils/zip";

export interface TrackedInitiativeProps {
    participants: InitiativeParticipant[];
    encounter: Encounter;
    history: Command[];
}

export class TrackedInitiative {
    private _participants: InitiativeParticipant[];
    private _encounter: Encounter;
    private _history: Command[];

    constructor(props: TrackedInitiativeProps) {
        this._participants = props.participants;
        this._encounter = props.encounter;
        this._history = props.history;
    }
    get participants(): InitiativeParticipant[] {
        return this._participants;
    }
    get encounter(): Encounter {
        return this._encounter;
    }
    get history(): Command[] {
        return this._history;
    }
    static startInitiative(encounter: Encounter, initiativeList: number[]): TrackedInitiative {
        const participants = zip(encounter.toEncounterParticipantList(), initiativeList).map(([slot, initiative]) => {
            return new InitiativeParticipant({
                initiative,
                actor: slot,
            });
        });
        
        return new TrackedInitiative({
            participants,
            encounter,
            history: []
        });
    }
}