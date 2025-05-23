import { HitPoints } from "@/models/utility/hitPoints/HitPoints.class";
import { Statblock } from "@/models/utility/statblock/Statblock.class";
import { RoundParticipant, RoundParticipantProps, RoundTimer } from "./RoundParticipant.class";

export interface ParticipantProps extends RoundParticipantProps {
    level: number;
    initiativeTieBreakerMode: number;
    hitPoints: HitPoints;
    statblock?: Statblock;
}

export class Participant extends RoundParticipant implements Readonly<RoundParticipantProps>, RoundTimer {
    private _level: number;
    private _initiativeTieBreakerMode: number;
    private _hitPoints: HitPoints;
    private _statblock?: Statblock;
    currentRoundTimestamp?: number | undefined;
    roundDurations: number[];
    pauseLabel = "Delay turn";
    resumeLabel = "Re-enter initiative";
    startLabel = "K.O.";
    stopLabel = "Recover";
    beginLabel = "Turn start";
    endLabel = "End turn";
    pause() { // Delay turn
    }
    resume() { // Re-enter initiative
    }
    start() { // Knocked out participant
    }
    stop() { // Recover from dying
    }
    begin() { // Begin turn action
    }
    end() { // End turn action
    }

    constructor(props: ParticipantProps) {
        super(props);
        this._level = props.level;
        this._initiativeTieBreakerMode = props.initiativeTieBreakerMode;
        this._hitPoints = props.hitPoints;
        this._statblock = props.statblock;
        this.currentRoundTimestamp = undefined;
        this.roundDurations = [];
    }
    get level(): number {
        return this._level;
    }
    get initiativeTieBreakerMode(): number {
        return this._initiativeTieBreakerMode;
    }
    get hitPoints(): HitPoints {
        return this._hitPoints;
    }
    get statblock(): Statblock | undefined {
        return this._statblock;
    }
}