import { v4 as uuidv4 } from 'uuid';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuilderListLayout, type BuilderListLayoutKey } from '../BuilderListLayout';
import type { BuilderFormValues, BuilderVariantSnapshot } from '../builderConvert';
import type { UseFormReturn } from 'react-hook-form';
import { Card } from '@/components/ui/card';

interface VariantListSectionProps {
	form: UseFormReturn<BuilderFormValues>;
	variants: BuilderVariantSnapshot[];
	safePartyLevel: number;
	safePartySize: number;
	activeVariantItemId: string;
	onActiveVariantItemIdChange: (id: string) => void;
	layoutKey?: BuilderListLayoutKey;
	onLayoutKeyChange?: (key: BuilderListLayoutKey) => void;
}

export function VariantListSection({
	form,
	variants,
	safePartyLevel,
	safePartySize,
	activeVariantItemId,
	onActiveVariantItemIdChange,
	layoutKey,
	onLayoutKeyChange,
}: VariantListSectionProps) {
	return (
		<BuilderListLayout
			label="Saved variants"
			layoutKey={layoutKey}
			onLayoutKeyChange={onLayoutKeyChange}
			allowedLayouts={['compact-tabs', 'wide-tabs', 'compact-grid', 'wide-grid', 'list']}
			items={variants}
			getItemId={(snapshot) => snapshot.id}
			getItemLabel={(snapshot, index) =>
				snapshot.description?.trim().length
					? snapshot.description
					: `Variant ${index + 1}`
			}
			renderItem={(snapshot, idx) => (
				<Card className="p-4">
					<div className="flex items-center mr-5">
						<Input
							className="h-8 text-sm rounded-r-none"
							value={snapshot.description}
							onChange={(e) => {
								const updated = variants.map((v, i) =>
									i === idx ? { ...v, description: e.target.value } : v
								);

								form.setValue('variants', updated, { shouldDirty: true });
							}}
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							title="Restore this snapshot"
							className="h-8 rounded-l-none border-l-0"
							onClick={() => {
								const confirmed = window.confirm(
									`Restore "${snapshot.description}"? This will overwrite the current party size, party level, and participants.`
								);

								if (!confirmed) return;
								form.setValue('partyLevel', snapshot.partyLevel, {
									shouldDirty: true,
								});
								form.setValue('partySize', snapshot.partySize, {
									shouldDirty: true,
								});
								form.setValue(
									'slots',
									snapshot.slots.map((s) => ({ ...s })),
									{ shouldDirty: true }
								);
							}}
						>
							<>Restore <RotateCcw className="h-4 w-4" /></>
						</Button>
					</div>
					<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
						<span className="rounded border px-2 py-1">Party size: {snapshot.partySize}</span>
						<span className="rounded border px-2 py-1">Party level: {snapshot.partyLevel}</span>
						<span className="rounded border px-2 py-1">
							Participants:{' '}
							{snapshot.slots.filter((s) => s.type === 'creature' || s.type === 'hazard').length}
						</span>
					</div>
				</Card>
			)}
			onRemoveItem={(_, idx) => {
				const updated = variants.filter((_, i) => i !== idx);

				form.setValue('variants', updated, { shouldDirty: true });
			}}
			emptyState={
				<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
					No variants saved yet. Create one to store a reusable snapshot.
				</div>
			}
			activeItemId={activeVariantItemId}
			onActiveItemIdChange={onActiveVariantItemIdChange}
			toolbarActions={
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						const label =
							window.prompt(
								'Variant description:',
								`Variant ${variants.length + 1} (${safePartySize} players, level ${safePartyLevel})`
							) ?? `Variant ${variants.length + 1}`;
						const snapshot: BuilderVariantSnapshot = {
							id: uuidv4(),
							description: label,
							partyLevel: safePartyLevel,
							partySize: safePartySize,
							slots: form.getValues('slots').map((s) => ({ ...s })),
						};

						form.setValue('variants', [...variants, snapshot], {
							shouldDirty: true,
						});
						onActiveVariantItemIdChange(snapshot.id);
					}}
				>
					Save current state as variant
				</Button>
			}
		/>
	);
}
