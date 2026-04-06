import { UuidElement } from "@/models/utility/uuidElement/UuidElement.class";
import { z } from "zod";
import { TemplateSlotProps, TemplateSlot, TemplateSlotType, TemplateSlotFieldDescriptor } from "./TemplateSlot.class";


export interface NarrativeSlotProps extends TemplateSlotProps {
    eventRound?: number;
}

export class NarrativeSlot extends TemplateSlot {
    public type: TemplateSlotType = "narrative";
    public eventRound?: number;

    constructor(props: NarrativeSlotProps) {
        super(props);
        this.eventRound = props.eventRound;
    }

    static getFieldDescriptors(): TemplateSlotFieldDescriptor[] {
        return [
            { name: "name", type: "text", label: "Name", placeholder: "Event Name", validation: z.string().min(1) },
            { name: "description", type: "text", label: "Description", placeholder: "Describe...", validation: z.string().optional() },
            { name: "eventRound", type: "number", label: "Event Round", placeholder: "1", validation: z.number().int().optional() },
        ];
    }
    static Schema = UuidElement.Schema.extend({
        type: z.literal("narrative"),
        name: z.string().min(1),
        description: z.string().optional(),
        eventRound: z.number().int().optional(),
    });
}
