import { RoundParticipant, RoundParticipantProps, RoundTimer } from "../actors/participant/RoundParticipant.class";
import { EncounterSlot } from "../encounters/EncounterSlot.class";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";

export interface InitiativeParticipantProps extends UuidElementProps {
    initiative: number;
    actor: RoundParticipant;
}

export class InitiativeParticipant extends UuidElement implements RoundParticipantProps, Readonly<RoundTimer> {
    public initiative: number;
    public actor: RoundParticipant;

    constructor(props: InitiativeParticipantProps) {
        super(props);
        this.initiative = props.initiative;
        this.actor = props.actor;
        this.actor.parent = this;
    }
    get currentRound(): number {
        return this.actor.currentRound;
    }
    get parent(): InitiativeParticipant | undefined {
        return this
    }
    get name(): string {
        return this.actor.name;
    }
    set name(name: string) {
        this.actor.name = name;
    }
    get currentRoundTimestamp(): number | undefined {
        return this.actor.currentRoundTimestamp;
    }
    get roundDurations(): number[] {
        return this.actor.roundDurations;
    }
    get encounterSlot(): EncounterSlot | undefined {
        return this.actor.encounterSlot;
    }
}