import { z } from "zod";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";

interface TemplateEventProps extends UuidElementProps {
    turn: number;
    description?: string;
}

export class TemplateEvent extends UuidElement {
    public turn: number;
    public description: string;
    constructor(props: TemplateEventProps) { 
        super(props); 
        this.turn = props.turn;
        this.description = props.description || "";
    }
    static Schema = UuidElement.Schema.extend({
        turn: z.number().int().min(0, "Turn must be a non-negative integer"),
        description: z.string().optional(),
    });
}