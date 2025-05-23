import { InitiativeParticipant } from "../initiative/InitiativeParticipant.class";
import { ActivityType } from "../utility/activity/Activity";

export interface ActorProps {
    parent?: InitiativeParticipant;
    name?: string;
}

export abstract class Actor implements ActivityType {
    private _parent?: InitiativeParticipant;
    abstract readonly name: string;
    constructor(props: ActorProps) {
        this._parent = props.parent;
    }
    pause() {
        console.log(`${this.pauseLabel}: ${this.name}`);
    }
    resume() {
        console.log(`${this.resumeLabel}: ${this.name}`);
    }
    start() {
        console.log(`${this.startLabel}: ${this.name}`);
    }
    stop() {
        console.log(`${this.stopLabel}: ${this.name}`);
    }
    begin() {
        console.log(`${this.beginLabel}: ${this.name}`);
    }
    end() {
        console.log(`${this.endLabel}: ${this.name}`);
    }
    get parent(): InitiativeParticipant | undefined {
        return this._parent;
    }
    set parent(parent: InitiativeParticipant | undefined) {
        this._parent = parent;
    }
    pauseLabel = "Pause";
    resumeLabel = "Resume";
    startLabel = "Start";
    stopLabel = "Stop";
    beginLabel = "Begin";
    endLabel = "End";
}