import { TabsContent } from '@/components/ui/tabs';
import type { EncounterVariant } from '@/models/encounters/encounter.types';
import { VariantListSection } from '../sections/VariantListSection';
import { TemplateVariantListSection } from '../sections/TemplateVariantListSection';
import type { BuilderListLayoutKey } from '../BuilderListLayout';
import type {
	BuilderFormValues,
	BuilderVariantSnapshot,
} from '../builderConvert';
import type { UseFormReturn } from 'react-hook-form';

interface BuilderVariantsStepProps {
	form: UseFormReturn<BuilderFormValues>;
	variants: BuilderVariantSnapshot[];
	safePartyLevel: number;
	safePartySize: number;
	activeVariantItemId: string;
	onActiveVariantItemIdChange: (id: string) => void;
	templateShadowVariants: EncounterVariant[];
	templateVariantId?: string;
	activeTemplateVariantItemId: string;
	onActiveTemplateVariantItemIdChange: (id: string) => void;
	onVariantSaved: (snapshotId: string) => void;
	variantsLayoutKey?: BuilderListLayoutKey;
	onVariantsLayoutKeyChange: (key: BuilderListLayoutKey) => void;
	templateVariantsLayoutKey?: BuilderListLayoutKey;
	onTemplateVariantsLayoutKeyChange: (key: BuilderListLayoutKey) => void;
}

export function BuilderVariantsStep({
	form,
	variants,
	safePartyLevel,
	safePartySize,
	activeVariantItemId,
	onActiveVariantItemIdChange,
	templateShadowVariants,
	templateVariantId,
	activeTemplateVariantItemId,
	onActiveTemplateVariantItemIdChange,
	onVariantSaved,
	variantsLayoutKey,
	onVariantsLayoutKeyChange,
	templateVariantsLayoutKey,
	onTemplateVariantsLayoutKeyChange,
}: BuilderVariantsStepProps) {
	return (
		<TabsContent value="variants" className="space-y-4">
			<section className="space-y-3">
				<p className="text-xs text-muted-foreground">
					Snapshot the current builder state as a reusable variant.
				</p>
				<VariantListSection
					form={form}
					variants={variants}
					safePartyLevel={safePartyLevel}
					safePartySize={safePartySize}
					activeVariantItemId={activeVariantItemId}
					onActiveVariantItemIdChange={onActiveVariantItemIdChange}
					layoutKey={variantsLayoutKey}
					onLayoutKeyChange={onVariantsLayoutKeyChange}
				/>
			</section>

			{templateShadowVariants.length > 0 ? (
				<section className="space-y-3">
					<TemplateVariantListSection
						templateShadowVariants={templateShadowVariants}
						templateVariantId={templateVariantId}
						form={form}
						safePartyLevel={safePartyLevel}
						activeItemId={activeTemplateVariantItemId}
						onActiveItemIdChange={onActiveTemplateVariantItemIdChange}
						onVariantSaved={onVariantSaved}
						layoutKey={templateVariantsLayoutKey}
						onLayoutKeyChange={onTemplateVariantsLayoutKeyChange}
					/>
				</section>
			) : null}
		</TabsContent>
	);
}
