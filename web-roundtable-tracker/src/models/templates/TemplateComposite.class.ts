import { ExperienceBudget } from "../utility/experienceBudget/ExperienceBudget";
import { Threat } from "../utility/threat/Threat.class";
import { UuidElement, UuidElementProps } from "../utility/uuidElement/UuidElement.class";
import { EncounterTemplate } from "./EncounterTemplate.class";
import { TemplateSlot } from "./TemplateSlot.class";

interface TemplateCompositeProps extends UuidElementProps {
    variants: EncounterTemplate[];
    mainVariantIndex?: number;
} 

export class TemplateComposite extends UuidElement implements EncounterTemplate {
    private variants: EncounterTemplate[];
    private mainVariantIndex: number = 0;
    constructor(props: TemplateCompositeProps) {
        super(props);
        this.mainVariantIndex = props.mainVariantIndex ?? 0;
        this.variants = props.variants;
    }
    selectVariant(index: number): void {
        if (index < 0 || index >= this.variants.length) {
            throw new Error(`Variant index ${index} is out of bounds.`);
        }
        this.mainVariantIndex = index;
    }
    public get variantCount(): number {
        return this.variants.length;
    }
    public get variantIndex(): number {
        return this.mainVariantIndex;
    }
    public get experienceBudget(): ExperienceBudget {
        return this.variants[this.mainVariantIndex].experienceBudget;
    }
    public get experienceAward(): ExperienceBudget {
        return this.variants[this.mainVariantIndex].experienceAward;
    }
    public findSlot(id: string): TemplateSlot | undefined {
        return this.variants[this.mainVariantIndex].findSlot(id);
    }
    public get name(): string {
        return this.variants[this.mainVariantIndex].name;
    }
    public get description(): string {
        return this.variants[this.mainVariantIndex].description;
    }
    public get slots(): TemplateSlot[] {
        return this.variants[this.mainVariantIndex].slots;
    }
    public get partySize(): number {
        return this.variants[this.mainVariantIndex].partySize;
    }
    public get threatLevel(): Threat {
        return this.variants[this.mainVariantIndex].threatLevel;
    }
}