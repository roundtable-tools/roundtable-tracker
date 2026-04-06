import { UuidElement } from "@/models/utility/uuidElement/UuidElement.class";
import { z } from "zod";
import { TemplateSlotProps, TemplateSlot, TemplateSlotType, TemplateSlotFieldDescriptor } from "./TemplateSlot.class";


export interface AuraSlotProps extends TemplateSlotProps {
    auraTarget?: "everyone" | "enemy" | "ally" | "neutral";
    auraCycle?: number;
}

export class AuraSlot extends TemplateSlot {
    public type: TemplateSlotType = "aura";
    public auraTarget?: "everyone" | "enemy" | "ally" | "neutral";
    public auraCycle?: number;

    constructor(props: AuraSlotProps) {
        super(props);
        this.auraTarget = props.auraTarget;
        this.auraCycle = props.auraCycle;
    }

    static getFieldDescriptors(): TemplateSlotFieldDescriptor[] {
        return [
            { name: "name", type: "text", label: "Name", placeholder: "Aura Name", validation: z.string().min(1) },
            { name: "description", type: "text", label: "Description", placeholder: "Describe...", validation: z.string().optional() },
            {
                name: "auraTarget", type: "select", label: "Aura Target", options: [
                    { value: "everyone", label: "Everyone" },
                    { value: "enemy", label: "Enemy" },
                    { value: "ally", label: "Ally" },
                    { value: "neutral", label: "Neutral" },
                ], validation: z.enum(["everyone", "enemy", "ally", "neutral"]).optional()
            },
            { name: "auraCycle", type: "number", label: "Aura Cycle", placeholder: "1", validation: z.number().int().optional() },
        ];
    }

    static Schema = UuidElement.Schema.extend({
        type: z.literal("aura"),
        name: z.string().min(1),
        description: z.string().optional(),
        auraTarget: z.enum(["everyone", "enemy", "ally", "neutral"]).optional(),
        auraCycle: z.number().int().optional(),
    });
}
