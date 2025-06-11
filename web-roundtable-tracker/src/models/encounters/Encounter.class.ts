import { RoundParticipant } from "../actors/participant/RoundParticipant.class";
import { EncounterTemplate, EncounterTemplateProps } from "../templates/EncounterTemplate.class";
import { EncounterSlot } from "./EncounterSlot.class";

interface EncounterProps extends EncounterTemplateProps {
    template?: EncounterTemplate;
    slots: EncounterSlot[];
}

export class Encounter extends EncounterTemplate {
    public slots: EncounterSlot[];
    public template?: EncounterTemplate;

    constructor(props: EncounterProps) {
        super(props);
        this.slots = props.slots;
        this.template = props.template;
    }
    toEncounterParticipantList(): RoundParticipant[] {
        return this.slots.map(slot => {
            return slot.toRoundParticipant();
        }).map(participant => {
            return new RoundParticipant({
                name: participant.name,
                encounterSlot: participant.encounterSlot,
            });
        });
    }
}