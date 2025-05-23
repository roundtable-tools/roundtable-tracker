import { LevelDifference } from "../utility/level/LevelDifference";
import { Statblock } from "../utility/statblock/Statblock.class";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";
import { TemplateEvent } from "./TemplateEvent.class";

export interface TemplateSlotProps extends UuidElementProps {
    name: string;
    description: string;
    offset?: LevelDifference;
    statblock?: Statblock;
    event?: TemplateEvent;
};

export class TemplateSlot extends UuidElement {
    public name: string;
    public description: string;
    public offset?: LevelDifference;
    public statblock?: Statblock;
    public event?: TemplateEvent;
    constructor(props: TemplateSlotProps) { 
        super(props); 
        this.name = props.name;
        this.description = props.description;
        this.offset = props.offset;
        this.statblock = props.statblock;
        this.event = props.event;
    }
}