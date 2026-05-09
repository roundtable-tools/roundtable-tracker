import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { BuilderListLayout } from '../BuilderListLayout';
import { templateVariantToFormPartial } from '../builderConvert';
import type { BuilderFormValues, BuilderVariantSnapshot } from '../builderConvert';
import type { UseFormReturn } from 'react-hook-form';
import type { EncounterVariant } from '@/models/encounters/encounter.types';

interface TemplateVariantListSectionProps {
	templateShadowVariants: EncounterVariant[];
	templateVariantId?: string;
	form: UseFormReturn<BuilderFormValues>;
	safePartyLevel: number;
	activeItemId: string;
	onActiveItemIdChange: (id: string) => void;
	onVariantSaved: (snapshotId: string) => void;
}

export function TemplateVariantListSection({
	templateShadowVariants,
	templateVariantId,
	form,
	safePartyLevel,
	activeItemId,
	onActiveItemIdChange,
	onVariantSaved,
}: TemplateVariantListSectionProps) {
	const applyVariant = (tv: EncounterVariant) => {
		const partial = templateVariantToFormPartial(tv, safePartyLevel);

		form.setValue('partySize', partial.partySize, { shouldDirty: true });
		form.setValue('slots', partial.slots, { shouldDirty: true });

		return partial;
	};

	return (
		<>
			<div>
				<h3 className="text-sm font-medium text-muted-foreground">From template</h3>
				<p className="text-xs text-muted-foreground">
					These are the original template variants. Load one to apply it to the current form,
					or load and save to create a concrete variant snapshot.
				</p>
			</div>
			<BuilderListLayout
				label="Template variants"
				allowedLayouts={['compact-tabs', 'wide-tabs', 'wide-grid', 'list']}
				items={templateShadowVariants}
				getItemId={(variant) => variant.id}
				getItemLabel={(variant, index) =>
					variant.description?.trim().length
						? variant.description
						: `Template Variant ${index + 1}`
				}
				renderItem={(tv) => {
					const isCurrentVariant = tv.id === templateVariantId;

					return (
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm text-muted-foreground italic">
									{tv.description ?? `Party of ${tv.partySize}`}
									{isCurrentVariant ? ' (current)' : ''}
								</span>
								<div className="flex gap-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="text-xs"
										onClick={() => applyVariant(tv)}
									>
										Load
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="text-xs"
										onClick={() => {
											const partial = applyVariant(tv);
											const label =
												window.prompt(
													'Variant description:',
													tv.description ?? `Party of ${tv.partySize}`
												) ??
												tv.description ??
												`Party of ${tv.partySize}`;
											const snapshot: BuilderVariantSnapshot = {
												id: uuidv4(),
												description: label,
												partyLevel: safePartyLevel,
												partySize: partial.partySize,
												slots: partial.slots.map((s) => ({ ...s })),
											};

											form.setValue(
												'variants',
												[...form.getValues('variants'), snapshot],
												{ shouldDirty: true }
											);
											onVariantSaved(snapshot.id);
										}}
									>
										Load &amp; Save
									</Button>
								</div>
							</div>
							<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
								<span className="rounded border border-dashed px-2 py-1">
									Party size: {tv.partySize}
								</span>
								{tv.partyLevel && (
									<span className="rounded border border-dashed px-2 py-1">
										Party level: {tv.partyLevel}
									</span>
								)}
								<span className="rounded border border-dashed px-2 py-1">
									Participants: {tv.participants.length}
								</span>
							</div>
						</div>
					);
				}}
				emptyState={
					<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
						No template variants available.
					</div>
				}
				activeItemId={activeItemId}
				onActiveItemIdChange={onActiveItemIdChange}
			/>
		</>
	);
}
