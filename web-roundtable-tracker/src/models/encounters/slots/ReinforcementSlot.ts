import { UuidElement } from "@/models/utility/uuidElement/UuidElement.class";
import { z } from "zod";
import { CreatureSlotProps } from "./CreatureSlot";
import { TemplateSlot, TemplateSlotType, TemplateSlotFieldDescriptor } from "./TemplateSlot.class";


export interface ReinforcementSlotProps extends CreatureSlotProps {
    reinforcementRound?: number;
}

export class ReinforcementSlot extends TemplateSlot {
    public type: TemplateSlotType = "reinforcement";
    public side?: "enemy" | "ally" | "neutral";
    public reinforcementRound?: number;

    constructor(props: ReinforcementSlotProps) {
        super(props);
        this.side = props.side;
        this.reinforcementRound = props.reinforcementRound;
    }

    static getFieldDescriptors(): TemplateSlotFieldDescriptor[] {
        return [
            { name: "name", type: "text", label: "Name", placeholder: "Reinforcement", validation: z.string().min(1) },
            { name: "description", type: "text", label: "Description", placeholder: "Describe...", validation: z.string().optional() },
            {
                name: "side", type: "select", label: "Side", options: [
                    { value: "enemy", label: "Enemy" },
                    { value: "ally", label: "Ally" },
                    { value: "neutral", label: "Neutral" },
                ], validation: z.enum(["enemy", "ally", "neutral"]).optional()
            },
            { name: "reinforcementRound", type: "number", label: "Reinforcement Round", placeholder: "1", validation: z.number().int().optional() },
        ];
    }
    static Schema = UuidElement.Schema.extend({
        type: z.literal("reinforcement"),
        name: z.string().min(1),
        description: z.string().optional(),
        side: z.enum(["enemy", "ally", "neutral"]).optional(),
        reinforcementRound: z.number().int().optional(),
    });
}
