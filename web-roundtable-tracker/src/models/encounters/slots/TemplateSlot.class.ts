import z, { ZodTypeAny } from "zod";
import { LevelDifference } from "../../utility/level/LevelDifference";
import { Statblock } from "../../utility/statblock/Statblock.class";
import { UuidElement, UuidElementProps } from "../../utility/uuidElement/UuidElement.class";
import { TemplateEvent } from "../templates/TemplateEvent.class";

export type TemplateSlotType = "creature" | "reinforcement" | "narrative" | "aura";

export interface TemplateSlotFieldDescriptor {
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    validation: ZodTypeAny;
}

export interface TemplateSlotProps extends UuidElementProps {
    type: TemplateSlotType;
    name: string;
    description?: string;
    offset?: LevelDifference;
    statblock?: Statblock;
    event?: TemplateEvent;
}

export abstract class TemplateSlot extends UuidElement {
    public abstract type: TemplateSlotType;
    public name: string;
    public description: string;
    public offset?: LevelDifference;
    public statblock?: Statblock;
    public event?: TemplateEvent;

    constructor(props: TemplateSlotProps) {
        super(props);
        this.name = props.name;
        this.description = props.description || "";
        this.offset = props.offset;
        this.statblock = props.statblock;
        this.event = props.event;
    }

    // Each subclass must implement its own schema and field descriptors
    static getFieldDescriptors(): TemplateSlotFieldDescriptor[] {
        throw new Error("getFieldDescriptors must be implemented by subclass");
    }

}

