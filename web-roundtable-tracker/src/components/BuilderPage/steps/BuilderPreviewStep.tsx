import { TabsContent } from '@/components/ui/tabs';
import type { EncounterVariant } from '@/models/encounters/encounter.types';
import { BuilderPreviewTab } from '../BuilderPreviewTab';
import type { BuilderFormValues } from '../builderConvert';
import type { Control } from 'react-hook-form';

interface BuilderPreviewStepProps {
	control: Control<BuilderFormValues>;
	templateVariants: EncounterVariant[];
	attritionRatePercent: number;
	maxRounds: number;
	basePartyOutputPerRound: number;
}

export function BuilderPreviewStep({
	control,
	templateVariants,
	attritionRatePercent,
	maxRounds,
	basePartyOutputPerRound,
}: BuilderPreviewStepProps) {
	return (
		<TabsContent value="preview" className="space-y-4">
			<BuilderPreviewTab
				control={control}
				templateVariants={templateVariants}
				attritionRatePercent={attritionRatePercent}
				maxRounds={maxRounds}
				basePartyOutputPerRound={basePartyOutputPerRound}
			/>
		</TabsContent>
	);
}
