import { Participant } from "./Participant.class";
import { Actor } from "../Actor.class";
import { HitPoints } from "@/models/utility/hitPoints/HitPoints.class";
import { Statblock } from "@/models/utility/statblock/Statblock.class";
import { RoundParticipantProps, RoundTimer } from "./RoundParticipant.class";
import { EncounterSlot } from "@/models/encounters/EncounterSlot.class";

interface ReinforcementParticipantProps extends Omit<RoundParticipantProps, "encounterSlot"> {
    participant: Participant;
}

export class ReinforcementParticipant extends Actor implements Readonly<RoundParticipantProps>, RoundTimer{
    participant: Participant;
    resumeLabel = "Join initiative";
    private _currentRound: number;
    currentRoundTimestamp?: number | undefined;
    roundDurations: number[];
    resume(): void {
        super.resume();
        //TODO: swap this.participant with this
    }
    constructor(props: ReinforcementParticipantProps) {
        super(props);
        this.participant = props.participant;
        this._currentRound = props.currentRound ?? 0;
        this.currentRoundTimestamp = undefined;
        this.roundDurations = [];
    }
    get encounterSlot(): EncounterSlot | undefined {
        return this.participant.encounterSlot;
    }
    get level(): number {
        return this.participant.level;
    }
    get name(): string {
        return this.participant.name;
    }
    get initiativeTieBreakerMode(): number {
        return this.participant.initiativeTieBreakerMode;
    }
    get hitPoints(): HitPoints {
        return this.participant.hitPoints;
    }
    get statblock(): Statblock | undefined {
        return this.participant.statblock;
    }
    get currentRound(): number {
        return this._currentRound;
    }
}