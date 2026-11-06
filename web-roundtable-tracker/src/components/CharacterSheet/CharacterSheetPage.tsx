import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ChangeEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { FileUp, Printer, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { ActionPicker } from './ActionPicker';
import {
	actionOptions,
	characterTraits,
	chosenCards,
	loadActionData,
	type ActionChoices,
	type ActionData,
} from './actions';
import {
	CharacterSheet,
	type FillApi,
	type OriginInfo,
} from './CharacterSheet';
import { SPELLS_MIN_MM, spellsFitOnExploration } from './pageFit';
import { DescriptionPicker } from './DescriptionPicker';
import {
	attachTargets,
	buildInventory,
	formatBulk,
	locationOptions,
	resolveItems,
	type ItemLocation,
	type ItemOverride,
	type ItemOverrides,
} from './inventory';
import {
	deriveSheet,
	parsePathbuilderJson,
	PathbuilderParseError,
	splitBackground,
	type PathbuilderBuild,
} from './pathbuilder';
import {
	descriptionOptions,
	isDescriptionChosen,
	loadReferenceData,
	shortBackgroundDetails,
	classDetailsOf,
	type DescriptionChoices,
	type ReferenceData,
} from './reference';
import sampleJson from './sampleRatfolkRogue.json?raw';
import { spellNames, spellPages } from './spells';

const JSON_KEY = 'character-sheet:json';

// Up to this level the notes share the feats and inventory page.
const MERGE_NOTES_MAX_LEVEL = 4;

type SavedKind = 'items' | 'actions' | 'descriptions' | 'layout' | 'strikes';

// Strikes the player turned off (all are printed by default).
type StrikeChoices = Record<string, boolean>;

type LayoutChoices = {
	mergeNotes?: boolean;
	levels?: number;
	// Spells on the exploration page instead of its blank cards.
	spellsOnExploration?: boolean;
	// Chosen spell texts as cards on the actions page.
	spellTextOnActions?: boolean;
};

// The level ladder shows levels up to the next attribute boost (5, 10, 15,
// 20) by default.
const nextBoostLevel = (level: number) =>
	Math.min(20, Math.ceil((level + 1) / 5) * 5);

const characterKey = (kind: SavedKind, b: PathbuilderBuild) =>
	`character-sheet:${kind}:${b.name.trim()}|${b.ancestry}|${b.class}`;

// Browser storage can be missing or blocked; the page works without it.
function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Placements just aren't remembered.
	}
}

function readSaved<T>(kind: SavedKind, build: PathbuilderBuild): T {
	try {
		return JSON.parse(readStorage(characterKey(kind, build)) ?? '{}') as T;
	} catch {
		return {} as T;
	}
}

function parse(text: string) {
	try {
		return { build: parsePathbuilderJson(text), error: null };
	} catch (e) {
		return {
			build: null,
			error:
				e instanceof PathbuilderParseError
					? e.message
					: 'Could not read this JSON.',
		};
	}
}

export function CharacterSheetPage() {
	const [jsonText, setJsonText] = useState(
		() => readStorage(JSON_KEY) ?? sampleJson
	);
	const [draft, setDraft] = useState('');
	const [importError, setImportError] = useState<string | null>(null);

	const { build } = useMemo(() => parse(jsonText), [jsonText]);
	const [overrides, setOverrides] = useState<ItemOverrides>({});
	const [choices, setChoices] = useState<ActionChoices>({});
	const [actionData, setActionData] = useState<ActionData | null>(null);
	const [actionError, setActionError] = useState(false);
	const [descChoices, setDescChoices] = useState<DescriptionChoices>({});
	const [layout, setLayout] = useState<LayoutChoices>({});
	const [strikeChoices, setStrikeChoices] = useState<StrikeChoices>({});
	const [refData, setRefData] = useState<ReferenceData | null>(null);
	const [refError, setRefError] = useState(false);

	useEffect(() => {
		if (!build) return;
		setOverrides(readSaved<ItemOverrides>('items', build));
		setChoices(readSaved<ActionChoices>('actions', build));
		setDescChoices(readSaved<DescriptionChoices>('descriptions', build));
		setLayout(readSaved<LayoutChoices>('layout', build));
		setStrikeChoices(readSaved<StrikeChoices>('strikes', build));
	}, [build]);

	useEffect(() => {
		loadActionData()
			.then(setActionData)
			.catch(() => setActionError(true));
		loadReferenceData()
			.then(setRefData)
			.catch(() => setRefError(true));
	}, []);

	// Lets the print stylesheet show only the sheet portal.
	useEffect(() => {
		document.body.classList.add('cs-printable');

		return () => document.body.classList.remove('cs-printable');
	}, []);

	const load = (text: string) => {
		const result = parse(text);

		if (result.error) {
			setImportError(result.error);

			return;
		}
		setImportError(null);
		setJsonText(text);
		setDraft('');
		writeStorage(JSON_KEY, text);
	};

	const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';

		if (!file) return;
		let text: string;

		try {
			text = await file.text();
		} catch {
			setImportError('Could not read this file.');

			return;
		}
		load(text);
	};

	const updateOverride = (id: string, change: ItemOverride) => {
		if (!build) return;
		setOverrides((prev) => {
			const next = { ...prev, [id]: { ...prev[id], ...change } };
			writeStorage(characterKey('items', build), JSON.stringify(next));

			return next;
		});
	};

	const resetPlacements = () => {
		if (!build) return;
		setOverrides({});
		writeStorage(characterKey('items', build), '{}');
	};

	const toggleAction = (key: string, on: boolean) => {
		if (!build) return;
		setChoices((prev) => {
			const next = { ...prev, [key]: on };
			writeStorage(characterKey('actions', build), JSON.stringify(next));

			return next;
		});
	};

	const toggleDescription = (key: string, on: boolean) => {
		if (!build) return;
		setDescChoices((prev) => {
			const next = { ...prev, [key]: on };
			writeStorage(characterKey('descriptions', build), JSON.stringify(next));

			return next;
		});
	};

	const toggleStrike = (key: string, on: boolean) => {
		if (!build) return;
		setStrikeChoices((prev) => {
			const next = { ...prev, [key]: on };
			writeStorage(characterKey('strikes', build), JSON.stringify(next));

			return next;
		});
	};

	const updateLayout = (change: LayoutChoices) => {
		if (!build) return;
		const next = { ...layout, ...change };
		setLayout(next);
		writeStorage(characterKey('layout', build), JSON.stringify(next));
	};

	const fullSheet = useMemo(() => (build ? deriveSheet(build) : null), [build]);
	// The sheet as printed: only the strikes the player kept.
	const sheet = useMemo(
		() =>
			fullSheet && {
				...fullSheet,
				strikes: fullSheet.strikes.filter((s) => strikeChoices[s.key] ?? true),
			},
		[fullSheet, strikeChoices]
	);
	const inventory = useMemo(
		() => (build ? buildInventory(build) : []),
		[build]
	);
	const items = useMemo(
		() => resolveItems(inventory, overrides),
		[inventory, overrides]
	);
	const options = useMemo(() => (build ? locationOptions(build) : []), [build]);
	const actionOpts = useMemo(
		() => (build && actionData ? actionOptions(actionData, build) : []),
		[build, actionData]
	);
	const traits = useMemo(
		() => (build && actionData ? characterTraits(actionData, build) : []),
		[build, actionData]
	);

	// Blank-row counts measured on the preview, reused by the print copy.
	const [fillCounts, setFillCounts] = useState<Record<string, number>>({});
	const reportFill = useCallback(
		(id: string, count: number) =>
			setFillCounts((prev) =>
				prev[id] === count ? prev : { ...prev, [id]: count }
			),
		[]
	);
	const previewFill = useMemo<FillApi>(
		() => ({ counts: fillCounts, report: reportFill }),
		[fillCounts, reportFill]
	);
	const printFill = useMemo<FillApi>(
		() => ({ counts: fillCounts }),
		[fillCounts]
	);
	const cards = useMemo(
		() => (sheet ? chosenCards(actionOpts, choices, sheet) : []),
		[actionOpts, choices, sheet]
	);
	const descOpts = useMemo(
		() =>
			build && sheet && refData
				? descriptionOptions(
						refData,
						build,
						sheet,
						traits,
						cards,
						actionOpts
							.filter((o) => o.group === 'feat')
							.map((o) => o.entry.name),
						inventory.map((i) => i.name),
						spellNames(build)
					)
				: [],
		[build, sheet, refData, traits, cards, actionOpts, inventory]
	);
	const descriptions = useMemo(
		() => descOpts.filter((o) => isDescriptionChosen(o, descChoices)),
		[descOpts, descChoices]
	);
	const origin = useMemo<OriginInfo>(
		() => ({
			traits,
			classDetails: build && refData ? classDetailsOf(refData, build) : [],
			backgroundDetails: (() => {
				if (!build) return undefined;
				// Pathbuilder's own choices first ("Nature, Dubious Knowledge"),
				// then what the background grants.
				const { name, choices } = splitBackground(build.background);
				const granted = refData?.backgrounds[name.toLowerCase()]?.details;
				// With Pathbuilder's choices listed, "your choice of ..."
				// sentences only repeat them.
				const details = granted
					?.split(/(?<=\.)\s+/)
					.filter((sentence) => !(choices && /your choice/i.test(sentence)))
					.join(' ');

				return (
					[choices, details && shortBackgroundDetails(details)]
						.filter(Boolean)
						.join(' · ') || undefined
				);
			})(),
		}),
		[traits, build, refData]
	);
	// Focus spells alone also get a spell page.
	const hasSpellPage = useMemo(
		() => (build ? spellPages(build).length > 0 : false),
		[build]
	);
	const mergeNotes =
		layout.mergeNotes ?? (build?.level ?? 0) <= MERGE_NOTES_MAX_LEVEL;
	const levelCount = layout.levels ?? nextBoostLevel(build?.level ?? 1);

	return (
		<div className="flex flex-col gap-6 p-4">
			<section className="flex flex-col gap-3 rounded-lg border p-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<h1 className="text-lg font-semibold">Character sheet</h1>
						<p className="text-muted-foreground text-sm">
							Paste or upload a Pathbuilder 2e “Export JSON”, choose where each
							item is carried, then print (Save as PDF, A4).
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" asChild>
							<label className="cursor-pointer">
								<FileUp />
								Upload JSON
								<input
									type="file"
									accept="application/json,.json,.txt"
									className="hidden"
									onChange={onFile}
								/>
							</label>
						</Button>
						<Button variant="outline" onClick={() => load(sampleJson)}>
							Load sample
						</Button>
						<Button onClick={() => window.print()} disabled={!build}>
							<Printer />
							Print / PDF
						</Button>
					</div>
				</div>
				<Textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder='{"success":true,"build":{…}}'
					className="h-20 font-mono text-xs"
				/>
				<div className="flex items-center gap-3">
					<Button
						variant="secondary"
						disabled={!draft.trim()}
						onClick={() => load(draft)}
					>
						Load pasted JSON
					</Button>
					{importError && (
						<span className="text-destructive text-sm">{importError}</span>
					)}
				</div>
			</section>

			{build && sheet && (
				<>
					<section className="flex flex-col gap-3 rounded-lg border p-4">
						<div className="flex items-center justify-between gap-2">
							<div>
								<h2 className="font-semibold">Where is each item?</h2>
								<p className="text-muted-foreground text-sm">
									Pathbuilder only tracks containers. Set what is in hand, worn
									or ready on the belt. Bulk comes from a built-in list; type it
									for items without one (L, —, or a number). Use “Part of” when
									two entries are one thing (cards used as the stance’s weapon)
									or for add-ons like shield augmentations: the item follows its
									parent and adds its Bulk to it.
								</p>
							</div>
							<Button variant="ghost" size="sm" onClick={resetPlacements}>
								<RotateCcw />
								Reset
							</Button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="text-muted-foreground text-left text-xs uppercase">
									<tr>
										<th className="py-1 pr-2">Item</th>
										<th className="py-1 pr-2">Qty</th>
										<th className="py-1 pr-2">Where</th>
										<th className="py-1 pr-2">Part of</th>
										<th className="py-1 pr-2">Bulk each</th>
										<th className="py-1">Total</th>
									</tr>
								</thead>
								<tbody>
									{items.map((item) => (
										<tr key={item.id} className="border-t">
											<td className="py-1 pr-2">{item.name}</td>
											<td className="py-1 pr-2">{item.qty}</td>
											<td className="py-1 pr-2">
												<select
													className="bg-background h-8 rounded-md border px-2"
													value={item.location}
													disabled={!!item.attachedTo}
													onChange={(e) =>
														updateOverride(item.id, {
															location: e.target.value as ItemLocation,
														})
													}
												>
													{options
														.filter(
															(o) => o.value !== `container:${item.containerId}`
														)
														.map((o) => (
															<option key={o.value} value={o.value}>
																{o.label}
															</option>
														))}
												</select>
											</td>
											<td className="py-1 pr-2">
												<select
													className="bg-background h-8 w-48 rounded-md border px-2"
													value={item.attachedTo ?? ''}
													onChange={(e) =>
														updateOverride(item.id, {
															attachedTo: e.target.value || undefined,
														})
													}
												>
													<option value="">—</option>
													{attachTargets(items, item).map((t) => (
														<option key={t.id} value={t.id}>
															{t.name}
														</option>
													))}
												</select>
											</td>
											<td className="py-1 pr-2">
												<Input
													className="h-8 w-20"
													value={overrides[item.id]?.bulk ?? ''}
													placeholder={
														item.unitBulk === undefined &&
														!overrides[item.id]?.bulk
															? '?'
															: formatBulk(item.unitBulk ?? 0)
													}
													onChange={(e) =>
														updateOverride(item.id, { bulk: e.target.value })
													}
												/>
											</td>
											<td className="py-1">
												{item.bulkKnown ? formatBulk(item.totalBulk) : '?'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					<section className="flex flex-col gap-3 rounded-lg border p-4">
						<div>
							<h2 className="font-semibold">Strikes</h2>
							<p className="text-muted-foreground text-sm">
								Pick which strikes are printed: each weapon, the ranged option
								of a thrown weapon, the fist added when the build has no unarmed
								attack, and a kineticist's melee and ranged Elemental Blasts.
							</p>
						</div>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-x-4 gap-y-1">
							{fullSheet?.strikes.map((s) => (
								<label key={s.key} className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={strikeChoices[s.key] ?? true}
										onChange={(e) => toggleStrike(s.key, e.target.checked)}
									/>
									<span>
										{s.name}
										{s.name !== s.baseName && ` (${s.baseName})`}
										<span className="text-muted-foreground">
											{' '}
											·{' '}
											{s.ranged
												? `ranged${s.range ? `, ${s.range}` : ''}`
												: 'melee'}{' '}
											{s.attack >= 0 ? '+' : ''}
											{s.attack}
										</span>
									</span>
								</label>
							))}
						</div>
					</section>

					<section className="flex flex-col gap-3 rounded-lg border p-4">
						<div>
							<h2 className="font-semibold">Actions page</h2>
							<p className="text-muted-foreground text-sm">
								Pick what gets a card on the actions page. Feats that take an
								action are on by default. Rules text comes from Archive of
								Nethys.
							</p>
						</div>
						{actionData ? (
							<ActionPicker
								options={actionOpts}
								choices={choices}
								sheet={sheet}
								onToggle={toggleAction}
							/>
						) : (
							<p className="text-muted-foreground text-sm">
								{actionError ? 'Could not load the action list.' : 'Loading…'}
							</p>
						)}
					</section>

					<section className="flex flex-col gap-3 rounded-lg border p-4">
						<div>
							<h2 className="font-semibold">Descriptions</h2>
							<p className="text-muted-foreground text-sm">
								Pick what gets a short description on the reference page. Hover
								a name to read it. Rules text comes from Archive of Nethys.
							</p>
						</div>
						{refData ? (
							<DescriptionPicker
								options={descOpts}
								choices={descChoices}
								onToggle={toggleDescription}
							/>
						) : (
							<p className="text-muted-foreground text-sm">
								{refError ? 'Could not load the descriptions.' : 'Loading…'}
							</p>
						)}
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={mergeNotes}
								onChange={(e) => updateLayout({ mergeNotes: e.target.checked })}
							/>
							Put the notes (appearance, personality, campaign) on the feats and
							inventory page instead of their own page
						</label>
						<label className="flex items-center gap-2 text-sm">
							Feat levels to print
							<select
								className="bg-background h-8 rounded-md border px-2"
								value={levelCount}
								onChange={(e) =>
									updateLayout({ levels: Number(e.target.value) })
								}
							>
								{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
									<option key={n} value={n}>
										1–{n}
										{n === nextBoostLevel(build.level) ? ' (next boost)' : ''}
									</option>
								))}
							</select>
						</label>
						{hasSpellPage && (
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={!!layout.spellsOnExploration}
									onChange={(e) =>
										updateLayout({ spellsOnExploration: e.target.checked })
									}
								/>
								Put the spells on the exploration page instead of blank
								exploration cards (blank spell rows shrink to fit)
							</label>
						)}
						{hasSpellPage && (
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={!!layout.spellTextOnActions}
									onChange={(e) =>
										updateLayout({ spellTextOnActions: e.target.checked })
									}
								/>
								Print the chosen spell texts (Descriptions → Spells) as cards on
								the actions page instead of under the spells
							</label>
						)}
						{layout.spellsOnExploration &&
							!spellsFitOnExploration(fillCounts) && (
								<p className="text-muted-foreground ml-6 text-sm">
									Not enough room there right now (the spells need about{' '}
									{SPELLS_MIN_MM} mm), so they stay on their own page. Untick
									some descriptions to make room.
								</p>
							)}
					</section>

					<div className="overflow-x-auto pb-4">
						<CharacterSheet
							build={build}
							sheet={sheet}
							items={items}
							cards={cards}
							origin={origin}
							descriptions={descriptions}
							mergeNotes={mergeNotes}
							levelCount={levelCount}
							spellInfo={actionData?.spells ?? {}}
							spellsOnExploration={!!layout.spellsOnExploration}
							spellTextOnActions={!!layout.spellTextOnActions}
							fill={previewFill}
						/>
					</div>
					{createPortal(
						<div className="cs-print-portal">
							<CharacterSheet
								build={build}
								sheet={sheet}
								items={items}
								cards={cards}
								origin={origin}
								descriptions={descriptions}
								mergeNotes={mergeNotes}
								levelCount={levelCount}
								spellInfo={actionData?.spells ?? {}}
								spellsOnExploration={!!layout.spellsOnExploration}
								spellTextOnActions={!!layout.spellTextOnActions}
								fill={printFill}
							/>
						</div>,
						document.body
					)}
				</>
			)}
		</div>
	);
}
