import { UUID } from "@/utils/uuid";
import { ExperienceBudget } from "../utility/experienceBudget/ExperienceBudget";
import { Threat } from "../utility/threat/Threat.class";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";
import { TemplateSlot } from "./TemplateSlot.class";
import { z } from "zod";

export interface EncounterTemplateProps extends UuidElementProps {
    name: string;
    description?: string;
    slots: TemplateSlot[];
    partySize: number;
}

export class EncounterTemplate extends UuidElement {
    public name: string;
    public description: string;
    public slots: TemplateSlot[];
    public partySize: number;
    public get threatLevel(): Threat {
        return Threat.fromExperienceBudget(this.experienceBudget, this.partySize);
    }
    public get experienceBudget(): ExperienceBudget {
        return this.slots.map(slot => slot.offset?.toExperience()).filter(el => el !== undefined).reduce((acc, val) => acc.sum(val), new ExperienceBudget(0));
    }
    public get experienceAward(): ExperienceBudget {
        return ExperienceBudget.budgetToBaseReward(this.experienceBudget, this.partySize);
    }
    public findSlot(id: UUID): TemplateSlot | undefined {
        return this.slots.find(slot => slot.id === id);
    }
    constructor(props: EncounterTemplateProps) { 
        super(props);
        this.name = props.name;
        this.description = props.description || "";
        this.slots = props.slots;
        this.partySize = props.partySize;
    }
    static Schema = UuidElement.Schema.extend({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        slots: z.array(TemplateSlot.Schema),
        partySize: z.number().int().min(1, "Party size must be at least 1"),
    });
}