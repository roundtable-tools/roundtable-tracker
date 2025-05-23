import { UUID } from "@/utils/uuid";
import { TemplateSlot, TemplateSlotProps } from "../templates/TemplateSlot.class";
import { RoundParticipant } from "../actors/participant/RoundParticipant.class";

interface EncounterSlotProps extends TemplateSlotProps {
    templateSlotId?: UUID;
}

export class EncounterSlot extends TemplateSlot {
    public templateSlotId?: UUID;

    constructor(props: EncounterSlotProps) {
        super(props);
        this.templateSlotId = props.templateSlotId;
    }
    toRoundParticipant(): RoundParticipant {
        return new RoundParticipant({
            name: this.name,
            encounterSlot: this,
        });
    }
}