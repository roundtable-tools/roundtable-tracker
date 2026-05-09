import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EncounterVariant } from '@/models/encounters/encounter.types';
import { computeEncounterXpUsage } from './builderXp';
import {
	defaultFormValues,
	templateVariantToFormPartial,
	type BuilderFormValues,
	type BuilderVariantSnapshot,
} from './builderConvert';
import {
	getEventSectionSummary,
	getParticipantSectionSummary,
	getSlotSectionIndices,
} from './slotSections';
import { ThreatTracker } from './ThreatTracker';

type PreviewVariantSource = 'base' | 'saved' | 'template';

type PreviewVariant = {
	key: string;
	label: string;
	source: PreviewVariantSource;
	partyLevel: number;
	partySize: number;
	description?: string;
	slots: BuilderFormValues['slots'];
};

type BuilderPreviewTabProps = {
	control: Control<BuilderFormValues>;
	templateVariants: EncounterVariant[];
	attritionRatePercent: number;
	maxRounds: number;
	basePartyOutputPerRound: number;
};

function formatSideLabel(side: BuilderFormValues['slots'][number]['side']) {
	switch (side) {
		case 'ally':
			return 'Allies';
		case 'other':
			return 'Other';
		default:
			return 'Opponents';
	}
}

function formatSlotTypeLabel(type: BuilderFormValues['slots'][number]['type']) {
	switch (type) {
		case 'creature':
			return 'Creature';
		case 'hazard':
			return 'Hazard';
		case 'reinforcement':
			return 'Reinforcement';
		default:
			return 'Event';
	}
}

function summarizeBuilderSlot(slot: BuilderFormValues['slots'][number]) {
	const chips: string[] = [];

	if (slot.type === 'creature' || slot.type === 'hazard') {
		chips.push(`L${slot.level}`);
		chips.push(`${slot.count}x`);
		chips.push(formatSideLabel(slot.side));

		if (typeof slot.maxHealth === 'number') {
			chips.push(`HP ${slot.maxHealth}`);
		}

		if (slot.type === 'hazard' && typeof slot.hardness === 'number') {
			chips.push(`Hardness ${slot.hardness}`);
		}

		if (typeof slot.initiativeBonus === 'number') {
			chips.push(
				`Init ${slot.initiativeBonus >= 0 ? '+' : ''}${slot.initiativeBonus}`
			);
		}

		if (slot.type === 'creature' && slot.adjustment !== 'none') {
			chips.push(slot.adjustment);
		}

		if ((slot.dcs?.length ?? 0) > 0) {
			const dcs = slot.dcs ?? [];
			chips.push(`${dcs.length} DC${dcs.length === 1 ? '' : 's'}`);
		}

		return chips;
	}

	if (slot.type === 'reinforcement') {
		chips.push(`Round ${slot.reinforcementRound}`);
		chips.push(`${(slot.reinforcementParticipants ?? []).length} participants`);
	}

	if (slot.type === 'narrative') {
		chips.push(`Round ${slot.eventRound}`);

		if (slot.repeatInterval) {
			chips.push(`Every ${slot.repeatInterval} rounds`);
		}

		chips.push(slot.accomplishmentLevel ?? 'story');
	}

	return chips;
}

function PreviewSlotCard({
	slot,
	label,
}: {
	slot: BuilderFormValues['slots'][number];
	label: string;
}) {
	const chips = summarizeBuilderSlot(slot);

	return (
		<div className="rounded-lg border bg-background p-3 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0 space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="truncate text-sm font-medium text-foreground">
							{label}
						</p>
						<Badge variant="outline">{formatSlotTypeLabel(slot.type)}</Badge>
					</div>
					{slot.description.trim().length > 0 ? (
						<p className="text-xs leading-5 text-muted-foreground">
							{slot.description}
						</p>
					) : (
						<p className="text-xs text-muted-foreground">No description.</p>
					)}
				</div>
				<div className="flex flex-wrap justify-end gap-1">
					{chips.map((chip) => (
						<Badge key={chip} variant="secondary" className="font-normal">
							{chip}
						</Badge>
					))}
				</div>
			</div>
		</div>
	);
}

function PreviewSection({
	title,
	description,
	count,
	children,
}: {
	title: string;
	description?: string;
	count?: number;
	children: ReactNode;
}) {
	return (
		<Card className="gap-0 border-muted/70 bg-background/80 shadow-sm">
			<CardHeader className="border-b pb-4">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<CardTitle className="text-base">{title}</CardTitle>
						{description ? (
							<CardDescription>{description}</CardDescription>
						) : null}
					</div>
					{typeof count === 'number' ? (
						<Badge variant="outline">{count}</Badge>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="space-y-3 pt-4">{children}</CardContent>
		</Card>
	);
}

export function BuilderPreviewTab({
	control,
	templateVariants,
	attritionRatePercent,
	maxRounds,
	basePartyOutputPerRound,
}: BuilderPreviewTabProps) {
	const values =
		(useWatch({ control }) as BuilderFormValues | undefined) ??
		defaultFormValues();
	const [activeVariantKey, setActiveVariantKey] = useState('base');

	const safePartyLevel =
		typeof values.partyLevel === 'number' && Number.isFinite(values.partyLevel)
			? values.partyLevel
			: 1;
	const safePartySize =
		typeof values.partySize === 'number' &&
		Number.isFinite(values.partySize) &&
		values.partySize > 0
			? values.partySize
			: 4;

	const previewVariants = useMemo<PreviewVariant[]>(() => {
		const baseVariant: PreviewVariant = {
			key: 'base',
			label: 'Current form',
			source: 'base',
			partyLevel: safePartyLevel,
			partySize: safePartySize,
			description: values.description,
			slots: values.slots,
		};

		const savedVariants = values.variants.map(
			(snapshot: BuilderVariantSnapshot, index) => ({
				key: `saved:${snapshot.id}`,
				label:
					snapshot.description?.trim().length > 0
						? snapshot.description
						: `Variant ${index + 1}`,
				source: 'saved' as const,
				partyLevel: snapshot.partyLevel,
				partySize: snapshot.partySize,
				description: snapshot.description,
				slots: snapshot.slots,
			})
		);

		const templateBasedVariants = templateVariants.map((variant, index) => {
			const templatePartial = templateVariantToFormPartial(
				variant,
				safePartyLevel
			);
			const templateDescription = variant.description ?? '';
			const label =
				templateDescription.trim().length > 0
					? templateDescription
					: `Variant ${String.fromCharCode(65 + index)}`;

			return {
				key: `template:${variant.id}`,
				label,
				source: 'template' as const,
				partyLevel: safePartyLevel,
				partySize: templatePartial.partySize,
				description: variant.description,
				slots: templatePartial.slots,
			};
		});

		return [baseVariant, ...savedVariants, ...templateBasedVariants];
	}, [
		safePartyLevel,
		safePartySize,
		templateVariants,
		values.description,
		values.slots,
		values.variants,
	]);

	useEffect(() => {
		if (!previewVariants.some((variant) => variant.key === activeVariantKey)) {
			setActiveVariantKey('base');
		}
	}, [activeVariantKey, previewVariants]);

	const activePreviewVariant =
		previewVariants.find((variant) => variant.key === activeVariantKey) ??
		previewVariants[0];
	const activeSlots = activePreviewVariant?.slots ?? [];
	const activeParticipantIndices = getSlotSectionIndices(
		activeSlots,
		'participants'
	);
	const activeEventIndices = getSlotSectionIndices(activeSlots, 'events');
	const activeParticipantSummary = getParticipantSectionSummary(activeSlots);
	const activeEventSummary = getEventSectionSummary(activeSlots);
	const activeXpUsage = computeEncounterXpUsage(
		activeSlots,
		activePreviewVariant?.partyLevel ?? safePartyLevel,
		activePreviewVariant?.partySize ?? safePartySize,
		{
			attritionRate: Math.max(0, attritionRatePercent) / 100,
			maxRounds: Math.max(1, maxRounds),
			basePartyOutputPerRound: Math.max(0, basePartyOutputPerRound),
		}
	);

	const builderVariants = previewVariants.filter(
		(variant) => variant.source === 'base' || variant.source === 'saved'
	);
	const templateVariantPreviews = previewVariants.filter(
		(variant) => variant.source === 'template'
	);

	return (
		<div className="space-y-4">
			<Card className="gap-0 border-muted/70 bg-background/90 shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">Readonly preview</Badge>
								<Badge variant="outline">
									{activePreviewVariant?.source === 'base'
										? 'Current form'
										: activePreviewVariant?.source === 'saved'
											? 'Builder snapshot'
											: 'Template variant'}
								</Badge>
							</div>
							<CardTitle className="text-2xl">
								{values.name?.trim().length
									? values.name
									: 'Untitled encounter'}
							</CardTitle>
							<CardDescription className="max-w-3xl leading-6">
								{values.description?.trim().length
									? values.description
									: 'No encounter description yet.'}
							</CardDescription>
						</div>
						<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
							<div className="rounded-lg border bg-muted/30 px-3 py-2">
								<p className="font-medium text-foreground">Party Level</p>
								<p>{activePreviewVariant?.partyLevel ?? safePartyLevel}</p>
							</div>
							<div className="rounded-lg border bg-muted/30 px-3 py-2">
								<p className="font-medium text-foreground">Party Size</p>
								<p>{activePreviewVariant?.partySize ?? safePartySize}</p>
							</div>
							<div className="rounded-lg border bg-muted/30 px-3 py-2">
								<p className="font-medium text-foreground">Participants</p>
								<p>{activeParticipantSummary.count}</p>
							</div>
							<div className="rounded-lg border bg-muted/30 px-3 py-2">
								<p className="font-medium text-foreground">Events</p>
								<p>{activeEventSummary.count}</p>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 pt-4">
					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-sm font-medium text-foreground">
									Variant switcher
								</p>
								<p className="text-xs text-muted-foreground">
									Swap the preview between the live form, saved snapshots, and
									template variants.
								</p>
							</div>
							<Badge variant="outline">{activePreviewVariant?.label}</Badge>
						</div>
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="flex flex-wrap gap-2">
									{builderVariants.map((variant) => {
										const isActive = variant.key === activeVariantKey;

										return (
											<Button
												key={variant.key}
												type="button"
												size="sm"
												variant={isActive ? 'default' : 'outline'}
												onClick={() => setActiveVariantKey(variant.key)}
											>
												{variant.label}
											</Button>
										);
									})}
								</div>
								{templateVariantPreviews.length > 0 ? (
									<div className="space-y-2">
										<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
											Template variants
										</p>
										<div className="flex flex-wrap gap-2">
											{templateVariantPreviews.map((variant) => {
												const isActive = variant.key === activeVariantKey;

												return (
													<Button
														key={variant.key}
														type="button"
														size="sm"
														variant={isActive ? 'default' : 'outline'}
														onClick={() => setActiveVariantKey(variant.key)}
													>
														{variant.label}
													</Button>
												);
											})}
										</div>
									</div>
								) : null}
							</div>
						</div>
					</div>

					<ThreatTracker
						budget={activeXpUsage.effectiveXp}
						comparisonBudget={activeXpUsage.rawXp}
						primaryBudgetLabel="Effective XP"
						comparisonBudgetLabel="Raw XP"
						partySize={activePreviewVariant?.partySize ?? safePartySize}
						waveInteraction={activeXpUsage.waveInteraction}
						simulation={activeXpUsage.simulation}
					/>

					<div className="grid gap-4 lg:grid-cols-2">
						<PreviewSection
							title="Details"
							description="Encounter metadata from the details tab."
						>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-lg border bg-background px-3 py-2">
									<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
										Encounter name
									</p>
									<p className="mt-1 text-sm font-medium">
										{values.name || 'Untitled'}
									</p>
								</div>
								<div className="rounded-lg border bg-background px-3 py-2">
									<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
										Active variant
									</p>
									<p className="mt-1 text-sm font-medium">
										{activePreviewVariant?.label ?? 'Current form'}
									</p>
								</div>
								<div className="rounded-lg border bg-background px-3 py-2 sm:col-span-2">
									<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
										Encounter description
									</p>
									<p className="mt-1 text-sm leading-6 text-foreground">
										{values.description?.trim().length
											? values.description
											: 'No description provided.'}
									</p>
								</div>
							</div>
						</PreviewSection>

						<PreviewSection
							title="Notes"
							description="All notes configured in the details tab."
						>
							{(values.notes ?? []).filter(
								(note) =>
									note.header?.trim().length > 0 ||
									note.content?.trim().length > 0
							).length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No notes configured.
								</p>
							) : (
								<div className="space-y-3 text-sm">
									{(values.notes ?? [])
										.filter(
											(note) =>
												note.header?.trim().length > 0 ||
												note.content?.trim().length > 0
										)
										.map((note, index) => (
											<div
												key={note.id || `${note.header}-${index}`}
												className="rounded-lg border bg-background px-3 py-2"
											>
												<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
													{note.header?.trim().length
														? note.header
														: `Note ${index + 1}`}
												</p>
												<p className="mt-1 whitespace-pre-wrap leading-6 text-foreground">
													{note.content?.trim().length
														? note.content
														: 'No note content.'}
												</p>
											</div>
										))}
								</div>
							)}
						</PreviewSection>
					</div>

					<PreviewSection
						title="Participants"
						description={activeParticipantSummary.breakdown}
						count={activeParticipantSummary.count}
					>
						<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
							<Badge variant="outline">{activeParticipantSummary.values}</Badge>
						</div>
						{activeParticipantIndices.length > 0 ? (
							<div className="space-y-2">
								{activeParticipantIndices.map((slotIndex) => {
									const slot = activeSlots[slotIndex];

									if (!slot) {
										return null;
									}

									return (
										<PreviewSlotCard
											key={slot.id}
											slot={slot}
											label={slot.name || `Participant ${slotIndex + 1}`}
										/>
									);
								})}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No participants configured.
							</p>
						)}
					</PreviewSection>

					<PreviewSection
						title="Events"
						description={activeEventSummary.breakdown}
						count={activeEventSummary.count}
					>
						<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
							<Badge variant="outline">{activeEventSummary.values}</Badge>
						</div>
						{activeEventIndices.length > 0 ? (
							<div className="space-y-2">
								{activeEventIndices.map((slotIndex) => {
									const slot = activeSlots[slotIndex];

									if (!slot) {
										return null;
									}

									const eventLabel =
										slot.type === 'reinforcement'
											? `Reinforcement ${slotIndex + 1}`
											: `Event ${slotIndex + 1}`;

									return (
										<PreviewSlotCard
											key={slot.id}
											slot={slot}
											label={eventLabel}
										/>
									);
								})}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No events configured.
							</p>
						)}
					</PreviewSection>
				</CardContent>
			</Card>
		</div>
	);
}
