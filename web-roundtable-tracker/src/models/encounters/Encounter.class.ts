import { RoundParticipant } from "../actors/participant/RoundParticipant.class";
import { EncounterTemplate, EncounterTemplateProps } from "../templates/EncounterTemplate.class";
import { Level } from "../utility/level/Level";
import { EncounterSlot } from "./EncounterSlot.class";
import { z } from "zod";

interface EncounterProps extends EncounterTemplateProps {
    template?: EncounterTemplate;
    slots: EncounterSlot[];
    partyLevel: Level;
}

export class Encounter extends EncounterTemplate {
    public slots: EncounterSlot[];
    public template?: EncounterTemplate;
    public partyLevel: Level;

    constructor(props: EncounterProps) {
        super(props);
        this.slots = props.slots;
        this.template = props.template;
        this.partyLevel = props.partyLevel;
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
    static Schema = EncounterTemplate.Schema.extend({
        slots: EncounterSlot.Schema.array(),
        template: EncounterTemplate.Schema.optional(),
        partyLevel: z.instanceof(Level),
        offset: z.never()
    });
}