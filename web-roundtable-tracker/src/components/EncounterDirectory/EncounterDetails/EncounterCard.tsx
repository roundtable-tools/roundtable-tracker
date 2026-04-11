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
import { DIFFICULTY, difficultyToString, Encounter } from '@/store/data';
import { useEffect, useState } from 'react';
import { useEncounterStore } from '@/store/instance';
import { useNavigate } from '@tanstack/react-router';
import { Pencil, Play, Trash2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

type EncounterCardProps = {
	selectedEncounter: Encounter;
	source?: 'template' | 'saved';
	encounterId?: string;
	onDelete?: () => void;
	submit: (encounter?: Encounter) => void;
	close: () => void;
};

export const EncounterCard = (props: EncounterCardProps) => {
	const { selectedEncounter, source, encounterId, onDelete, submit, close } = props;
	const navigate = useNavigate();
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setPartyLevel = useEncounterStore((state) => state.setPartyLevel);
	const [level, setLevel] = useState<number>(partyLevel);
	const isVariableLevel = Array.isArray(selectedEncounter.level);
	const partySize = selectedEncounter.partySize ?? 4;
	const participants = selectedEncounter.participants ?? [];

	const clampLevel = (value: number) => {
		if (!isVariableLevel) {
			return value;
		}

		return Math.min(
			selectedEncounter.level[1],
			Math.max(selectedEncounter.level[0], value)
		);
	};

	useEffect(() => {
		const level = Array.isArray(selectedEncounter.level)
			? Math.max(
					selectedEncounter.level[0],
					Math.min(selectedEncounter.level[1], partyLevel)
				)
			: selectedEncounter.level || 0;
		setLevel(level);
	}, [partyLevel, selectedEncounter]);

	return (
		<Card className="gap-0 rounded-none border-0 shadow-none">
			<CardHeader className="gap-4 border-b pb-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
								{source === 'saved' ? 'Saved Encounter' : 'Encounter Template'}
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
							{isVariableLevel ? (
								<div className="mt-3 flex items-center gap-3">
									<Input
										type="number"
										min={selectedEncounter.level[0]}
										max={selectedEncounter.level[1]}
										value={level}
										onChange={(event) => {
											const nextValue = Number.parseInt(event.target.value, 10);

											setLevel(
												clampLevel(Number.isNaN(nextValue) ? selectedEncounter.level[0] : nextValue)
											);
										}}
										className="h-9 w-24"
									/>
									<p className="text-xs text-muted-foreground">
										Range {selectedEncounter.level[0]}-{selectedEncounter.level[1]}
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
											index < partySize
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
				<section className="space-y-3">
					<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Participants
					</h3>
					<div className="rounded-xl border bg-muted/30 p-4">
						{participants.length > 0 ? (
							<ul className="space-y-2 text-sm text-muted-foreground">
								{participants.map((participant, index) => (
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
							if (isVariableLevel) {
								setPartyLevel(Math.max(1, level));
							} else if (typeof selectedEncounter.level === 'number') {
								setPartyLevel(Math.max(1, selectedEncounter.level));
							}

							submit();
						}}
						disabled={isVariableLevel && level <= 0}
					>
						<Play className="h-4 w-4" />
						Select
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};
