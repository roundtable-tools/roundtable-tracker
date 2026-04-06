import { UuidElement } from "@/models/utility/uuidElement/UuidElement.class";
import { z } from "zod";
import { TemplateSlotProps, TemplateSlot, TemplateSlotType, TemplateSlotFieldDescriptor } from "./TemplateSlot.class";

// --- Concrete Slot Types ---

export interface CreatureSlotProps extends TemplateSlotProps {
    side?: "enemy" | "ally" | "neutral";
}

export class CreatureSlot extends TemplateSlot {
    public type: TemplateSlotType = "creature";
    public side?: "enemy" | "ally" | "neutral";

    constructor(props: CreatureSlotProps) {
        super(props);
        this.side = props.side;
    }

    static getFieldDescriptors(): TemplateSlotFieldDescriptor[] {
        return [
            { name: "name", type: "text", label: "Name", placeholder: "Goblin", validation: z.string().min(1) },
            { name: "description", type: "text", label: "Description", placeholder: "Describe...", validation: z.string().optional() },
            {
                name: "side", type: "select", label: "Side", options: [
                    { value: "enemy", label: "Enemy" },
                    { value: "ally", label: "Ally" },
                    { value: "neutral", label: "Neutral" },
                ], validation: z.enum(["enemy", "ally", "neutral"]).optional()
            },
        ];
    }
    static Schema = UuidElement.Schema.extend({
        type: z.literal("creature"),
        name: z.string().min(1),
        description: z.string().optional(),
        side: z.enum(["enemy", "ally", "neutral"]).optional(),
    });
}
