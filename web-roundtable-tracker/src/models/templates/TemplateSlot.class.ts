import { z } from "zod";
import { LevelDifference } from "../utility/level/LevelDifference";
import { Statblock } from "../utility/statblock/Statblock.class";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";
import { TemplateEvent } from "./TemplateEvent.class";

export type TemplateSlotType = "creature" | "reinforcement" | "narrative" | "aura";

export interface TemplateSlotProps extends UuidElementProps {
    type: TemplateSlotType;
    name: string;
    description?: string;
    offset?: LevelDifference;
    statblock?: Statblock;
    event?: TemplateEvent;

    // Creature & Reinforcement
    side?: "enemy" | "ally" | "neutral";

    // Reinforcement
    reinforcementRound?: number;

    // Narrative
    eventRound?: number;

    // Aura
    auraTarget?: "everyone" | "enemy" | "ally" | "neutral";
    auraCycle?: number;
}

export class TemplateSlot extends UuidElement {
    public type: TemplateSlotType;
    public name: string;
    public description: string;
    public offset?: LevelDifference;
    public statblock?: Statblock;
    public event?: TemplateEvent;

    public side?: "enemy" | "ally" | "neutral";
    public reinforcementRound?: number;
    public eventRound?: number;
    public auraTarget?: "everyone" | "enemy" | "ally" | "neutral";
    public auraCycle?: number;

    constructor(props: TemplateSlotProps) { 
        super(props); 
        this.type = props.type;
        this.name = props.name;
        this.description = props.description || "";
        this.offset = props.offset;
        this.statblock = props.statblock;
        this.event = props.event;
        this.side = props.side;
        this.reinforcementRound = props.reinforcementRound;
        this.eventRound = props.eventRound;
        this.auraTarget = props.auraTarget;
        this.auraCycle = props.auraCycle;
    }
    static Schema = UuidElement.Schema.extend({
        type: z.enum(["creature", "reinforcement", "narrative", "aura"]),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        offset: z.number().int().optional(),
        statblock: z.instanceof(Statblock).optional(),
        event: TemplateEvent.Schema.optional(),
        side: z.enum(["enemy", "ally", "neutral"]).optional(),
        reinforcementRound: z.number().int().optional(),
        eventRound: z.number().int().optional(),
        auraTarget: z.enum(["everyone", "enemy", "ally", "neutral"]).optional(),
        auraCycle: z.number().int().optional(),
    });
}

TemplateSlot.Schema._getType