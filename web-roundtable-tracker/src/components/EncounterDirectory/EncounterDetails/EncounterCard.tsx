import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	type ConcreteEncounter,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	difficultyToString,
	Encounter,
	type Participant as StoreParticipant,
} from '@/store/data';
import { useEffect, useState } from 'react';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { useNavigate } from '@tanstack/react-router';
import { Pencil, Play, Trash2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import encounterTemplates from '@/store/Encounters/migratedEncounterTemplates';
import type { EncounterVariant } from '@/models/encounters/encounter.types';
import { saveImportedEncounterDraft } from '@/store/importedEncounterDraft';

function buildTemplateVariantParticipants(
	variant: EncounterVariant
): StoreParticipant<typeof LEVEL_REPRESENTATION.Relative>[] {
	return variant.participants.map((p) => {
		const base = {
			name: p.tag ?? p.role,
			level: p.relativeLevel.toString() as `+${number}` | `-${number}`,
			side: p.side,
			count: p.count,
		};

		if (p.type === 'hazard') {
			return {
				...base,
				type: 'hazard' as const,
				successesToDisable: p.successesToDisable,
				isComplexHazard: p.role === 'complex',
			};
		}

		return { ...base, type: 'creature' as const };
	});
}

type EncounterCardProps = {
	selectedEncounter: Encounter;
	source?: 'template' | 'saved';
	encounterId?: string;
	templateId?: string;
	templateVariantId?: string;
	onDelete?: () => void;
	submit: (encounter?: Encounter) => void;
	close: () => void;
};

export const EncounterCard = (props: EncounterCardProps) => {
	const {
		selectedEncounter,
		source,
		encounterId,
		templateId,
		templateVariantId,
		onDelete,
		submit,
		close,
	} = props;
	const navigate = useNavigate();
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setPartyLevel = useEncounterStore((state) => state.setPartyLevel);
	const encounterKindLabel =
		source === 'saved'
			? 'Saved Encounter'
			: source === 'template'
				? 'Encounter Template'
				: 'Imported Encounter';
	const canLoadImportedEncounterToEditor =
		source === undefined &&
		selectedEncounter.levelRepresentation === LEVEL_REPRESENTATION.Exact;

	// Variant switcher state
	const activeTemplate =
		source === 'template' && templateId
			? encounterTemplates.find((t) => t.id === templateId)
			: undefined;
	const allTemplateVariants = activeTemplate?.variants ?? [];
	const hasMultipleTemplateVariants = allTemplateVariants.length > 1;

	const savedVariants =
		source !== 'template' ? (selectedEncounter.variants ?? []) : [];
	const hasSavedVariants = savedVariants.length > 0;

	const [activeTemplateVariantId, setActiveTemplateVariantId] = useState<
		string | undefined
	>(templateVariantId);
	// null = base encounter for saved variants
	const [activeSavedVariantIdx, setActiveSavedVariantIdx] = useState<
		number | null
	>(null);

	const activeTemplateVariant = allTemplateVariants.find(
		(v) => v.id === activeTemplateVariantId
	);
	const activeSavedVariant =
		activeSavedVariantIdx !== null ? savedVariants[activeSavedVariantIdx] : null;

	// Derived display values based on active variant
	const displayedParticipants: StoreParticipant[] = (() => {
		if (source === 'template' && activeTemplateVariant) {
			return buildTemplateVariantParticipants(activeTemplateVariant);
		}
		if (source !== 'template' && activeSavedVariant) {
			return activeSavedVariant.participants as StoreParticipant[];
		}
		return selectedEncounter.participants ?? [];
	})();

	const displayedPartySize = (() => {
		if (source === 'template' && activeTemplateVariant) {
			return activeTemplateVariant.partySize;
		}
		if (source !== 'template' && activeSavedVariant) {
			return activeSavedVariant.partySize ?? selectedEncounter.partySize ?? 4;
		}
		return selectedEncounter.partySize ?? 4;
	})();

	const levelRange = Array.isArray(selectedEncounter.level)
		? selectedEncounter.level
		: undefined;

	const [level, setLevel] = useState<number>(partyLevel);

	const clampLevel = (value: number) => {
		if (!levelRange) {
			return value;
		}

		return Math.min(levelRange[1], Math.max(levelRange[0], value));
	};

	useEffect(() => {
		const level = levelRange
			? Math.max(levelRange[0], Math.min(levelRange[1], partyLevel))
			: (typeof selectedEncounter.level === 'number' ? selectedEncounter.level : 0);
		setLevel(level);
	}, [levelRange, partyLevel, selectedEncounter.level]);

	// Build override encounter for submit when a variant is active
	const buildVariantEncounter = (): Encounter | undefined => {
		if (source === 'template' && activeTemplateVariant) {
			return {
				...selectedEncounter,
				partySize: activeTemplateVariant.partySize,
				participants: buildTemplateVariantParticipants(activeTemplateVariant),
				description:
					activeTemplateVariant.description ?? selectedEncounter.description,
			} as Encounter;
		}
		if (source !== 'template' && activeSavedVariant) {
			return {
				...selectedEncounter,
				partySize: activeSavedVariant.partySize ?? selectedEncounter.partySize,
				level: activeSavedVariant.level ?? selectedEncounter.level,
				difficulty: activeSavedVariant.difficulty ?? selectedEncounter.difficulty,
				description: activeSavedVariant.description ?? selectedEncounter.description,
				participants: activeSavedVariant.participants,
			} as Encounter;
		}
		return undefined;
	};

	const handleLoadToEditor = () => {
		if (!canLoadImportedEncounterToEditor) {
			return;
		}

		const encounterToEdit =
			(buildVariantEncounter() ?? selectedEncounter) as ConcreteEncounter;
		const importDraftId = saveImportedEncounterDraft(encounterToEdit);
		close();
		navigate({
			to: '/builder',
			search: { importDraftId },
		});
	};

	return (
		<Card className="gap-0 rounded-none border-0 shadow-none">
			<CardHeader className="gap-4 border-b pb-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
								{encounterKindLabel}
							</span>
							<span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
								{difficultyToString(
									selectedEncounter.difficulty ?? DIFFICULTY.Moderate
								)}
							</span>
						</div>
						<div>
							<CardTitle className="text-2xl">{selectedEncounter.name}</CardTitle>
							<CardDescription className="mt-2 max-w-2xl text-sm leading-6">
								{selectedEncounter.description}
							</CardDescription>
						</div>
					</div>
					<div className="grid gap-3 sm:min-w-56">
						<div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
							<p className="font-medium text-foreground">Encounter Level</p>
							{levelRange ? (
								<div className="mt-3 flex items-center gap-3">
									<Input
										type="number"
										min={levelRange[0]}
										max={levelRange[1]}
										value={level}
										onChange={(event) => {
											const nextValue = Number.parseInt(event.target.value, 10);

											setLevel(
												clampLevel(Number.isNaN(nextValue) ? levelRange[0] : nextValue)
											);
										}}
										className="h-9 w-24"
									/>
									<p className="text-xs text-muted-foreground">
										Range {levelRange[0]}-{levelRange[1]}
									</p>
								</div>
							) : (
								<p className="mt-2 text-lg font-semibold">{selectedEncounter.level}</p>
							)}
						</div>
						<div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
							<p className="font-medium text-foreground">Party Size</p>
							<div className="mt-3 flex items-center gap-1">
								{Array.from({ length: 6 }).map((_, index) => (
									<UserRound
										key={index}
										className={cn(
											'h-4 w-4',
										index < displayedPartySize
												? 'text-foreground'
												: 'text-muted-foreground/40'
										)}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 py-6">
				{(hasMultipleTemplateVariants || hasSavedVariants) && (
					<section className="space-y-2">
						<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
							Variants
						</h3>
						<div className="flex flex-wrap gap-2">
							{source === 'template' &&
								allTemplateVariants.map((tv, idx) => {
									const label = tv.description ?? `Variant ${String.fromCharCode(65 + idx)}`;
									const isActive = tv.id === activeTemplateVariantId;
									return (
										<Button
											key={tv.id}
											type="button"
											size="sm"
											variant={isActive ? 'default' : 'outline'}
											onClick={() => setActiveTemplateVariantId(tv.id)}
										>
											{label}
										</Button>
									);
								})}
							{source !== 'template' && (
								<>
									<Button
										type="button"
										size="sm"
										variant={activeSavedVariantIdx === null ? 'default' : 'outline'}
										onClick={() => setActiveSavedVariantIdx(null)}
									>
										Base
									</Button>
									{savedVariants.map((sv, idx) => (
										<Button
											key={idx}
											type="button"
											size="sm"
											variant={activeSavedVariantIdx === idx ? 'default' : 'outline'}
											onClick={() => setActiveSavedVariantIdx(idx)}
										>
											{sv.description || `Variant ${idx + 1}`}
										</Button>
									))}
								</>
							)}
						</div>
					</section>
				)}
				<section className="space-y-3">
					<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Participants
					</h3>
					<div className="rounded-xl border bg-muted/30 p-4">
						{displayedParticipants.length > 0 ? (
							<ul className="space-y-2 text-sm text-muted-foreground">
								{displayedParticipants.map((participant, index) => (
									<li key={`${participant.name}-${index}`}>
										<span className="font-medium text-foreground">
											{participant.name}
										</span>
										{participant.count ? ` x${participant.count}` : ''}
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">No participants listed.</p>
						)}
					</div>
				</section>
			</CardContent>
			<CardFooter className="flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
					<Button variant="outline" onClick={close}>
						Back
					</Button>
					{source === 'saved' && onDelete ? (
						<Button variant="destructive" onClick={onDelete}>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					) : null}
					{source === 'template' && templateId ? (
						<Button
							variant="secondary"
							onClick={() => {
								const templateLevel = levelRange
									? level
									: (typeof selectedEncounter.level === 'number'
										? selectedEncounter.level
										: undefined);
								const templatePartySize = activeTemplateVariant?.partySize ?? selectedEncounter.partySize ?? 4;

								close();
								navigate({
									to: '/builder',
									search: {
										templateId,
										templateVariantId: activeTemplateVariantId,
										templateLevel,
										templatePartySize,
									},
								});
							}}
						>
							<Pencil className="h-4 w-4" />
							Use Template
						</Button>
					) : null}
					{canLoadImportedEncounterToEditor ? (
						<Button variant="secondary" onClick={handleLoadToEditor}>
							<Pencil className="h-4 w-4" />
							Load to Editor
						</Button>
					) : null}
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
					{source === 'saved' && encounterId ? (
						<Button
							variant="secondary"
							onClick={() => {
								close();
								navigate({ to: '/builder', search: { encounterId } });
							}}
						>
							<Pencil className="h-4 w-4" />
							Edit
						</Button>
					) : null}
					<Button
						onClick={() => {
							if (levelRange) {
								setPartyLevel(Math.max(1, level));
							} else if (typeof selectedEncounter.level === 'number') {
								setPartyLevel(Math.max(1, selectedEncounter.level));
							}

							submit(buildVariantEncounter());
						}}
						disabled={Boolean(levelRange && level <= 0)}
					>
						<Play className="h-4 w-4" />
						Select
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};
