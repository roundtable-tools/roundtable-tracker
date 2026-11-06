// The printable sheet: A4 pages following the official Pathfinder 2e
// (remaster) character sheet, drawn with plain boxes and game-icons.net
// icons instead of Paizo artwork. The character's own skills, strikes, items
// and actions come first; the space left on each page is filled with blank
// rows of the same kind (see Filler).

import {
	createContext,
	useContext,
	useLayoutEffect,
	useRef,
	type ReactNode,
} from 'react';

import { actionGlyphs, type ActionCard, type CardKind } from './actions';
import {
	bulkSummary,
	formatBulk,
	groupInventory,
	type InventoryGroup,
	type ResolvedItem,
} from './inventory';
import { lookupItem } from './itemCatalog';
import {
	DESCRIPTION_GROUP_TITLES,
	type DescriptionGroup,
	type DescriptionOption,
} from './reference';
import {
	ABILITY_KEYS,
	FEAT_GROUP_TITLES,
	formatMod,
	RANK_LETTERS,
	type Check,
	type DerivedSheet,
	type LevelRow,
	type PathbuilderBuild,
	type SheetFeat,
	splitBackground,
	type Strike,
} from './pathbuilder';
import { spellsFitOnExploration } from './pageFit';
import { ICON_CREDIT, SHEET_ICONS, type SheetIconName } from './sheetIcons';
import {
	spellPages,
	type SpellInfo,
	type SpellPage,
	type SpellRow,
} from './spells';

import './characterSheet.css';

const ABILITY_LABELS = {
	str: 'Strength',
	dex: 'Dexterity',
	con: 'Constitution',
	int: 'Intelligence',
	wis: 'Wisdom',
	cha: 'Charisma',
} as const;

const RANK_NAMES: Record<number, string> = {
	0: 'Untrained',
	2: 'Trained',
	4: 'Expert',
	6: 'Master',
	8: 'Legendary',
};

// Fixed row heights, so blank rows can be counted to fill a page.
const ROW_MM = {
	skill: 8.5,
	strike: 15,
	item: 4.4,
	actionRow: 27,
	spell: 5,
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const NBSP = ' ';

const setValue = (v: string | undefined) =>
	v && v.trim() && v !== 'Not set' ? v : undefined;

// --- Filling the rest of a page ----------------------------------------------
//
// A Filler takes the space left in its column and shows as many blank rows
// as fit. The sheet is rendered twice (preview and print copy); only the
// preview can measure, so it reports the counts and the print copy reuses
// them. Both copies have the same A4 content box.

type FillApi = {
	counts: Record<string, number>;
	report?: (id: string, count: number) => void;
};

const FillContext = createContext<FillApi>({ counts: {} });

const PX_PER_MM = 96 / 25.4;

function Filler({
	id,
	rowMm,
	children,
	className = '',
}: {
	id: string;
	rowMm: number;
	children: (count: number) => ReactNode;
	className?: string;
}) {
	const { counts, report } = useContext(FillContext);
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;

		if (!report || !el) return;
		// 1.5 mm spare so rounding never pushes a row onto the next page.
		const measure = () =>
			report(
				id,
				Math.max(0, Math.floor((el.clientHeight / PX_PER_MM - 1.5) / rowMm))
			);

		measure();
		const observer = new ResizeObserver(measure);

		observer.observe(el);

		return () => observer.disconnect();
	}, [id, rowMm, report]);

	return (
		<div ref={ref} className={`cs-filler ${className}`}>
			{children(counts[id] ?? 0)}
		</div>
	);
}

// Reports its own height in mm under `id`, through the same channel as the
// fillers (preview measures, print copy reuses).
function Measure({ id, children }: { id: string; children: ReactNode }) {
	const { report } = useContext(FillContext);
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;

		if (!report || !el) return;
		const measure = () => report(id, Math.ceil(el.offsetHeight / PX_PER_MM));

		measure();
		const observer = new ResizeObserver(measure);

		observer.observe(el);

		return () => observer.disconnect();
	}, [id, report]);

	return (
		<div ref={ref} className="cs-measure">
			{children}
		</div>
	);
}

const times = (n: number) => Array.from({ length: n }, (_, i) => i);

// --- Building blocks ----------------------------------------------------------

function SheetIcon({ name }: { name: SheetIconName }) {
	return (
		<svg className="cs-icon" viewBox="0 0 512 512" aria-hidden="true">
			<path d={SHEET_ICONS[name]} />
		</svg>
	);
}

// A number printed over a faint icon (AC, attack, HP, Speed, Bulk).
function IconStat({
	icon,
	value,
	label,
	className = '',
}: {
	icon: SheetIconName;
	value: ReactNode;
	label?: string;
	className?: string;
}) {
	return (
		<span className={`cs-icon-stat ${className}`}>
			<SheetIcon name={icon} />
			<span className="cs-icon-number">{value}</span>
			{label && <small>{label}</small>}
		</span>
	);
}

// Action cost in the Pathfinder2eActions font.
export function ActionGlyphs({ actions }: { actions: string }) {
	return (
		<span className="cs-glyphs">
			{actionGlyphs(actions).map((part, i) =>
				'glyph' in part ? (
					<span key={i} className="pf2-actions">
						{part.glyph}
					</span>
				) : (
					<span key={i}>{part.text}</span>
				)
			)}
		</span>
	);
}

function Section({
	title,
	children,
	className = '',
	titleHidden = false,
}: {
	title: string;
	children: ReactNode;
	className?: string;
	// Keeps the title's space but doesn't show it.
	titleHidden?: boolean;
}) {
	return (
		<section className={`cs-section ${className}`}>
			<h3
				className={`cs-section-title ${titleHidden ? 'cs-title-hidden' : ''}`}
			>
				<span>{title}</span>
			</h3>
			{children}
		</section>
	);
}

// A framed field with its label in the top-left corner.
function Box({
	label,
	value,
	className = '',
	children,
}: {
	label?: string;
	value?: ReactNode;
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div className={`cs-box ${className}`}>
			{label && <div className="cs-box-label">{label}</div>}
			{value !== undefined && <div className="cs-box-value">{value}</div>}
			{children}
		</div>
	);
}

function Ranks({ rank }: { rank: number }) {
	return (
		<span className="cs-ranks" aria-label={RANK_NAMES[rank] ?? ''}>
			{RANK_LETTERS.map((letter, i) => (
				<span
					key={letter}
					className={`cs-rank ${rank >= (i + 1) * 2 ? 'cs-rank-on' : ''}`}
				>
					{letter}
				</span>
			))}
		</span>
	);
}

type Part = { value?: number | string; label: string };

function Parts({ parts }: { parts: Part[] }) {
	return (
		<span className="cs-parts">
			{parts.map((p, i) => (
				<span key={p.label + i} className="cs-part">
					<b>
						{typeof p.value === 'number'
							? i === 0
								? p.value
								: formatMod(p.value)
							: (p.value ?? NBSP)}
					</b>
					<i>{p.label}</i>
				</span>
			))}
		</span>
	);
}

const checkParts = (c: Check, withArmor = false): Part[] => [
	{ value: c.abilityMod, label: cap(c.ability) },
	{ value: c.prof, label: 'Prof' },
	{ value: c.item || undefined, label: 'Item' },
	...(withArmor ? [{ value: c.armor || undefined, label: 'Armor' }] : []),
];

// --- Page 1: statistics ------------------------------------------------------

function SkillRow({ c, lore }: { c?: Check; lore?: boolean }) {
	if (!c) {
		return (
			<div className="cs-skill">
				<span className="cs-skill-name">
					<span className="cs-write-line" />
				</span>
				<span className="cs-total" />
				<Ranks rank={0} />
				<Parts
					parts={[{ label: 'Attr' }, { label: 'Prof' }, { label: 'Item' }]}
				/>
			</div>
		);
	}
	const armorSkill = c.ability === 'str' || c.ability === 'dex';

	return (
		<div className="cs-skill">
			<span className="cs-skill-name">
				{lore ? `${c.label} Lore` : c.label}
			</span>
			<span className="cs-total">{formatMod(c.total)}</span>
			<Ranks rank={c.rank} />
			<Parts parts={checkParts(c, armorSkill)} />
		</div>
	);
}

function Skills({ sheet }: { sheet: DerivedSheet }) {
	// Lores sit where "Lore" falls alphabetically, as on the official sheet.
	const before = sheet.skills.filter((s) => s.label < 'Lore');
	const after = sheet.skills.filter((s) => s.label >= 'Lore');

	return (
		<Section title="Skills" className="cs-skills cs-stretch">
			{before.map((s) => (
				<SkillRow key={s.key} c={s} />
			))}
			{sheet.lores.map((l) => (
				<SkillRow key={l.key} c={l} lore />
			))}
			{after.map((s) => (
				<SkillRow key={s.key} c={s} />
			))}
			<Filler id="skills" rowMm={ROW_MM.skill}>
				{(n) => times(n).map((i) => <SkillRow key={i} />)}
			</Filler>
		</Section>
	);
}

const mapPenalties = (s: Strike) =>
	/agile/i.test(s.traits ?? '') ? [4, 8] : [5, 10];

// A blank card (no strike) gets a d20 so it suggests neither melee nor ranged.
function StrikeCard({
	s,
	attachments = [],
	firstRanged = false,
}: {
	s?: Strike;
	attachments?: string[];
	// Starts the ranged strikes, which get a gap above them.
	firstRanged?: boolean;
}) {
	const [second, third] = s ? mapPenalties(s) : [5, 10];
	const impulse = s?.prof === 'impulse';
	const icon: SheetIconName = !s
		? 'attack'
		: s.ranged
			? impulse
				? 'rangedImpulse'
				: 'ranged'
			: impulse
				? 'meleeImpulse'
				: 'melee';

	return (
		<div className={`cs-strike ${firstRanged ? 'cs-first-ranged' : ''}`}>
			<Box label="Weapon" className="cs-strike-name" value={s?.name ?? NBSP}>
				{s && s.name !== s.baseName && (
					<span className="cs-tiny">{s.baseName}</span>
				)}
			</Box>
			<span className="cs-attack-group">
				<IconStat
					icon={icon}
					value={s ? formatMod(s.attack) : NBSP}
					className="cs-attack"
				/>
				<span className="cs-map" title="Multiple attack penalty">
					<span>
						<b>{s ? formatMod(s.attack - second) : NBSP}</b>
						<i>2nd</i>
					</span>
					<span>
						<b>{s ? formatMod(s.attack - third) : NBSP}</b>
						<i>3rd</i>
					</span>
				</span>
			</span>
			<Ranks rank={s?.rank ?? 0} />
			<Parts
				parts={[
					{
						value: s?.abilityPart,
						label: s ? cap(s.ability) : 'Attr',
					},
					{ value: s?.profPart, label: 'Prof' },
					{ value: s?.itemPart || undefined, label: 'Item' },
				]}
			/>
			<Box
				label="Damage"
				className="cs-strike-damage"
				value={s?.damage ?? NBSP}
			/>
			<span className="cs-bps">
				{['B', 'P', 'S'].map((t) => (
					<span key={t} className={s?.damageType.includes(t) ? 'cs-on' : ''}>
						{t}
					</span>
				))}
			</span>
			<div className="cs-strike-traits">
				<span className="cs-box-label">Traits and notes</span>
				{s?.range && <b>Range {s.range} · </b>}
				{s?.traits ?? ''}
				{attachments.length > 0 && (
					<span className="cs-small"> · with {attachments.join(', ')}</span>
				)}
			</div>
		</div>
	);
}

function Strikes({
	sheet,
	weaponAttachments,
}: {
	sheet: DerivedSheet;
	weaponAttachments: string[][];
}) {
	// Melee first, then ranged; the icon tells them apart.
	const ordered = [
		...sheet.strikes.filter((s) => !s.ranged),
		...sheet.strikes.filter((s) => s.ranged),
	];
	const attachmentsOf = (s: Strike) =>
		s.weaponIndex !== undefined ? (weaponAttachments[s.weaponIndex] ?? []) : [];

	return (
		<Section title="Strikes" className="cs-stretch">
			{ordered.map((s, i) => (
				<StrikeCard
					key={i}
					s={s}
					attachments={attachmentsOf(s)}
					firstRanged={s.ranged && !ordered[i - 1]?.ranged && i > 0}
				/>
			))}
			<Filler id="strikes" rowMm={ROW_MM.strike}>
				{(n) => times(n).map((i) => <StrikeCard key={i} />)}
			</Filler>
			<div className="cs-row">
				<Box label="Weapon proficiencies">
					<div className="cs-prof-row">
						{sheet.weaponProfs.map(({ key, rank }) => (
							<ProfLabel key={key} label={cap(key)} rank={rank} />
						))}
					</div>
				</Box>
				<Box label="Critical specializations" className="cs-grow" />
			</div>
		</Section>
	);
}

function ProfLabel({
	label,
	rank,
	current = false,
}: {
	label: string;
	rank: number;
	current?: boolean;
}) {
	return (
		<span className={`cs-prof ${current ? 'cs-current' : ''}`}>
			<Ranks rank={rank} />
			<span>
				<span className="cs-prof-name">{label}</span>
				<span className="cs-prof-rank">{RANK_NAMES[rank] ?? ''}</span>
			</span>
		</span>
	);
}

function armorNotes(sheet: DerivedSheet): string[] {
	const armor = sheet.wornArmor;
	const stats = sheet.armorStats;

	if (!armor) return ['No armor worn.'];

	if (!stats) return [`${armor.name}: armor stats unknown, check the item.`];
	const traits = lookupItem(armor.name)?.traits;
	const meets = sheet.meetsArmorStrength;
	const notes = [
		`${armor.name} (${stats.category}): +${stats.ac + (armor.pot ?? 0)} AC, Dex cap +${stats.dexCap}.`,
		`Strength ${formatMod(stats.strength)}: ${meets ? 'met' : 'not met'}.`,
		stats.checkPenalty
			? meets
				? `Check penalty ${stats.checkPenalty} doesn't apply (Strength met).`
				: `Check penalty ${stats.checkPenalty} on Str and Dex skills${stats.flexible ? ' except Acrobatics and Athletics' : ''}.`
			: 'No check penalty.',
		stats.speedPenalty
			? `Speed ${stats.speedPenalty} ft.${meets ? ', 5 ft. less with Strength met' : ''}.`
			: 'No Speed penalty.',
	];

	if (traits) notes.push(`Traits: ${traits}.`);

	if (armor.runes?.length) notes.push(`Runes: ${armor.runes.join(', ')}.`);

	return notes;
}

export type OriginInfo = {
	traits: string[];
	classDetails: string[];
	backgroundDetails?: string;
};

function PageOne({
	build,
	sheet,
	origin,
	weaponAttachments,
}: {
	build: PathbuilderBuild;
	sheet: DerivedSheet;
	origin: OriginInfo;
	weaponAttachments: string[][];
}) {
	const wornCategory = sheet.armorStats?.category ?? 'unarmored';

	return (
		<div className="cs-page cs-page1">
			<div className="cs-top">
				<div className="cs-wordmark">
					<span>Pathfinder 2e</span>
					<b>Character sheet</b>
				</div>
				<Section title="Character name" className="cs-top-name">
					<Box value={build.name.trim() || NBSP} className="cs-big-box" />
					<Box label="Player name" value={NBSP} />
				</Section>
				<Section title="Level" className="cs-top-level">
					<div className="cs-level-wrap">
						<span className="cs-level-badge">
							<span>{build.level}</span>
						</span>
						<Box label="XP" value={build.xp || NBSP} />
					</div>
				</Section>
				<Section title="Hero points" className="cs-top-hero">
					<div className="cs-hero-boxes">
						<span />
						<span />
						<span />
					</div>
					<div className="cs-tiny">
						Gain 1 at the start of each session. Spend 1 to reroll a check;
						spend all to avoid death.
					</div>
				</Section>
			</div>

			<div className="cs-origin">
				<Section title="Ancestry">
					<div className="cs-row">
						<Box value={build.ancestry} className="cs-grow" />
						<Box label="Size" value={build.sizeName} />
					</div>
					<Box
						label="Heritage and traits"
						value={[build.heritage, origin.traits.join(', ')]
							.filter(Boolean)
							.join(' · ')}
					/>
				</Section>
				<Section title="Background">
					<Box value={splitBackground(build.background).name} />
					<Box
						label="Background details"
						className="cs-wrap"
						value={origin.backgroundDetails || NBSP}
					/>
				</Section>
				<Section title="Class">
					<div className="cs-row">
						<Box
							className="cs-grow"
							value={
								build.dualClass
									? `${build.class} / ${build.dualClass}`
									: build.class
							}
						/>
						<Box
							label="Key attribute"
							value={ABILITY_LABELS[build.keyability]}
						/>
					</div>
					<Box
						label="Class details"
						className="cs-wrap"
						value={origin.classDetails.join(' · ') || NBSP}
					/>
				</Section>
			</div>

			<Section title="Attributes">
				<div className="cs-attributes">
					{ABILITY_KEYS.map((k) => (
						<div key={k} className="cs-attribute">
							<span className="cs-attribute-mod">
								{formatMod(sheet.mods[k])}
							</span>
							<span className="cs-attribute-name">
								{ABILITY_LABELS[k]}
								<small>
									<span
										className={`cs-check-box ${build.abilities[k] % 2 ? 'cs-on' : ''}`}
									/>
									Partial boost
								</small>
							</span>
						</div>
					))}
				</div>
			</Section>

			<div className="cs-defenses-row">
				<Section title="Defenses" className="cs-defenses">
					<div className="cs-defenses-grid">
						<div className="cs-ac-block">
							<div className="cs-ac-row">
								<div className="cs-ac-col">
									<span className="cs-stat-title">Armor Class</span>
									<div className="cs-ac-stat">
										<IconStat
											icon="armor"
											value={sheet.ac.acTotal}
											className="cs-ac"
										/>
									</div>
								</div>
								<div className="cs-ac-col">
									<span className="cs-stat-title">Shield</span>
									<IconStat
										icon="shield"
										value={
											sheet.shield
												? sheet.shield.bonus
													? `+${sheet.shield.bonus}`
													: '+'
												: NBSP
										}
										className="cs-shield-icon"
									/>
								</div>
								<div className="cs-ac-breakdown">
									<Parts
										parts={[
											{ value: 10, label: 'Base' },
											{ value: sheet.ac.acAbilityBonus, label: 'Dex*' },
											{ value: sheet.ac.acProfBonus, label: 'Prof' },
											{ value: sheet.ac.acItemBonus, label: 'Item' },
										]}
									/>
									<span className="cs-tiny">
										* Use the armor’s Dex cap if lower
									</span>
								</div>
								<div className="cs-shield-side">
									{/* One block for the shield's numbers, empty without a shield. */}
									<div className="cs-shield-block">
										<span>
											<i>Hardness</i>
											<b>{sheet.shield?.hardness ?? ''}</b>
										</span>
										<span>
											<i>Max HP</i>
											<b>{sheet.shield?.hp ?? ''}</b>
										</span>
										<span>
											<i>BT</i>
											<b>{sheet.shield?.bt ?? ''}</b>
										</span>
										<span>
											<i>HP</i>
										</span>
									</div>
									{sheet.shield && (
										<span className="cs-tiny">{sheet.shield.name}</span>
									)}
									{/* Right under the shield's numbers and tucked against the
									    shield icon's curve, as on the official sheet: a column of
									    T/E/M/L boxes per category; the worn armor's is highlighted. */}
									<div className="cs-armor-profs-block">
										<span className="cs-stat-title cs-small-title">
											Armor proficiencies
										</span>
										<div className="cs-armor-profs">
											{sheet.armorProfs.map(({ key, rank }) => (
												<span
													key={key}
													className={key === wornCategory ? 'cs-current' : ''}
												>
													<i>{cap(key)}</i>
													<Ranks rank={rank} />
												</span>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="cs-defenses-right">
							<div className="cs-saves">
								{sheet.saves.map((s) => (
									<div key={s.key} className="cs-save">
										<span className="cs-save-name">{s.label}</span>
										<div className="cs-save-total">
											<span>{formatMod(s.total)}</span>
											<Ranks rank={s.rank} />
										</div>
										<Parts parts={checkParts(s)} />
									</div>
								))}
							</div>
							<div className="cs-defense-notes">
								<span className="cs-box-label">Traits and notes</span>
								{armorNotes(sheet).map((n) => (
									<span key={n}>{n} </span>
								))}
							</div>
						</div>
					</div>
				</Section>
				<Section title="Hit points" className="cs-hp">
					<div className="cs-hp-grid">
						<IconStat
							icon="hp"
							value={sheet.hpMax}
							label="Max"
							className="cs-hp-max"
						/>
						<Box label="Current HP" className="cs-tall" />
						<div className="cs-hp-side">
							<Box label="Temporary HP" />
							{/* One faint skull behind Dying and Wounded. */}
							<div className="cs-hp-conditions">
								<svg
									className="cs-conditions-icon"
									viewBox="0 0 512 512"
									aria-hidden="true"
								>
									<path d={SHEET_ICONS.dying} />
								</svg>
								<div className="cs-condition-line">
									<span className="cs-condition-label">Dying</span>
									<span className="cs-dying-boxes">
										{times(4).map((i) => (
											<span key={i} />
										))}
									</span>
								</div>
								<div className="cs-condition-line">
									<span className="cs-condition-label">Wounded</span>
									<span className="cs-wounded-field" />
								</div>
							</div>
						</div>
					</div>
					<Box
						label="Resistances and immunities"
						value={(build.resistances ?? []).join(', ') || NBSP}
					/>
					<Box label="Conditions" className="cs-tall cs-stretch" />
				</Section>
			</div>

			<div className="cs-main">
				<Skills sheet={sheet} />
				<div className="cs-main-right">
					<div className="cs-lps">
						<Section title="Languages">
							<Box className="cs-fill" value={build.languages.join(', ')} />
						</Section>
						<Section title="Perception">
							<div className="cs-lps-stat">
								<IconStat
									icon="perception"
									value={formatMod(sheet.perception.total)}
									className="cs-perception-stat"
								/>
								<Ranks rank={sheet.perception.rank} />
								<Parts parts={checkParts(sheet.perception)} />
							</div>
							<Box label="Senses" value={sheet.senses.join(', ') || NBSP} />
						</Section>
						<Section title="Speed">
							<div className="cs-lps-stat">
								<IconStat
									icon="speed"
									value={sheet.speed}
									label="feet"
									className="cs-speed"
								/>
							</div>
							<Box label="Special movement" value={NBSP} />
						</Section>
					</div>
					<Strikes sheet={sheet} weaponAttachments={weaponAttachments} />
					<div className="cs-row">
						<Section title="Class DC" className="cs-class-dc">
							<div className="cs-dc">
								<span className="cs-total cs-total-big">
									{sheet.classDc.total}
								</span>
								<Ranks rank={sheet.classDc.rank} />
								<Parts
									parts={[
										{ value: 10, label: 'Base' },
										{ value: sheet.classDc.key, label: 'Key' },
										{ value: sheet.classDc.prof, label: 'Prof' },
									]}
								/>
							</div>
						</Section>
						<Section title="Reminders" className="cs-grow">
							<div className="cs-reminders">
								<div>
									<b>Proficiency</b>
									<span>Untrained +0</span>
									<span>Trained 2 + level</span>
									<span>Expert 4 + level</span>
									<span>Master 6 + level</span>
									<span>Legendary 8 + level</span>
								</div>
								<div>
									<b>Actions</b>
									<span>
										<ActionGlyphs actions="Single Action" /> Single action
									</span>
									<span>
										<ActionGlyphs actions="Two Actions" /> Two-action activity
									</span>
									<span>
										<ActionGlyphs actions="Three Actions" /> Three-action
										activity
									</span>
									<span>
										<ActionGlyphs actions="Free Action" /> Free action
									</span>
									<span>
										<ActionGlyphs actions="Reaction" /> Reaction
									</span>
								</div>
							</div>
						</Section>
					</div>
				</div>
			</div>
			<div className="cs-credit">{ICON_CREDIT}</div>
		</div>
	);
}

// --- Page 2: abilities and inventory -----------------------------------------

function FeatList({ feats, slot }: { feats: SheetFeat[]; slot: string }) {
	return (
		<div className="cs-feat-cell">
			<span className="cs-box-label">{slot}</span>
			{feats.map((f, i) => (
				<div key={`${f.name}-${i}`} className="cs-feat">
					{f.name}
					<span className="cs-tag">{FEAT_GROUP_TITLES[f.group]}</span>
				</div>
			))}
		</div>
	);
}

function LevelLadder({
	sheet,
	build,
	levelCount,
}: {
	sheet: DerivedSheet;
	build: PathbuilderBuild;
	// How many level rows to print, from level 1.
	levelCount: number;
}) {
	return (
		<div className="cs-ladder">
			<div className="cs-ladder-head">
				<span />
				<h3 className="cs-section-title">
					<span>Ancestry and general feats</span>
				</h3>
				<h3 className="cs-section-title">
					<span>Class abilities</span>
				</h3>
			</div>
			{sheet.levels.slice(0, levelCount).map((row: LevelRow) => (
				<div
					key={row.level}
					className={`cs-ladder-row ${row.level <= build.level ? 'cs-reached' : ''}`}
				>
					<span className="cs-diamond">
						<span>{row.level}</span>
					</span>
					<div className="cs-ladder-cell">
						{row.level === 1 && (
							<div className="cs-feat-cell">
								<span className="cs-box-label">
									Ancestry and heritage abilities
								</span>
								<div className="cs-feat">{build.heritage}</div>
								{sheet.senses.map((s) => (
									<div key={s} className="cs-feat">
										{s}
									</div>
								))}
							</div>
						)}
						<FeatList
							feats={row.left.filter((f) => f.name !== build.heritage)}
							slot={row.leftSlot}
						/>
						{row.boosts && <span className="cs-boosts">Attribute boosts</span>}
					</div>
					<div className="cs-ladder-cell">
						{row.level === 1 && (
							<div className="cs-feat-cell">
								<span className="cs-box-label">Class features</span>
								{sheet.classFeatures.map((f) => (
									<div key={f} className="cs-feat">
										{f}
									</div>
								))}
							</div>
						)}
						<FeatList feats={row.right} slot={row.rightSlot} />
					</div>
				</div>
			))}
		</div>
	);
}

function ItemRow({ item, worn }: { item: ResolvedItem; worn: boolean }) {
	return (
		<>
			<div className="cs-item">
				<span className="cs-item-name">
					{item.qty > 1 && <b>{item.qty}× </b>}
					{item.name}
					{item.hands ? <span className="cs-tiny"> {item.hands}h</span> : null}
				</span>
				{worn && <span className="cs-check-box cs-inv-col" />}
				<span className="cs-bulk-col">
					{item.attachments.length && !item.bulkWithAttachmentsKnown
						? '?'
						: item.bulkKnown || item.attachments.length
							? formatBulk(item.bulkWithAttachments)
							: ''}
				</span>
			</div>
			{item.attachments.map((a) => (
				<div key={a.id} className="cs-item cs-attachment">
					<span className="cs-item-name">
						↳ {a.qty > 1 && <b>{a.qty}× </b>}
						{a.name}
					</span>
				</div>
			))}
		</>
	);
}

function ItemGroup({ group }: { group: InventoryGroup }) {
	const worn = group.location === 'worn';

	return (
		<div className="cs-items">
			<div className="cs-items-head">
				<span className="cs-strong">{group.title}</span>
				{worn && <span className="cs-tiny cs-inv-col">Invested</span>}
				<span className="cs-tiny cs-bulk-col">Bulk</span>
			</div>
			{/* The group's total sits under the Bulk column. */}
			<div className="cs-tiny cs-hint-row">
				<span className="cs-hint">
					{group.hint}
					{group.countedBulk !== group.contentBulk &&
						` · counts ${formatBulk(group.countedBulk)}`}
				</span>
				<span className="cs-group-total">
					{group.contentBulk > 0 && formatBulk(group.contentBulk)}
					{group.capacity !== undefined && ` / ${formatBulk(group.capacity)}`}
				</span>
			</div>
			{group.items.map((item) => (
				<ItemRow key={item.id} item={item} worn={worn} />
			))}
		</div>
	);
}

function PageTwo({
	build,
	sheet,
	items,
	withNotes,
	levelCount,
	itemDescriptions,
}: {
	build: PathbuilderBuild;
	sheet: DerivedSheet;
	items: ResolvedItem[];
	// Descriptions of the items the player picked, under the inventory.
	itemDescriptions: DescriptionOption[];
	// Low-level characters get the notes on this page instead of their own.
	withNotes: boolean;
	levelCount: number;
}) {
	const groups = groupInventory(build, items);
	const bulk = bulkSummary(build, groups);
	const coins = [
		['CP', build.money.cp],
		['SP', build.money.sp],
		['GP', build.money.gp],
		['PP', build.money.pp],
	] as const;

	return (
		<div className={`cs-page ${withNotes ? 'cs-merged' : ''}`}>
			<div className="cs-page2">
				<div className="cs-page2-left">
					<LevelLadder sheet={sheet} build={build} levelCount={levelCount} />
					{withNotes && <CompactNotes build={build} />}
				</div>
				<div className="cs-inventory">
					<Section title="Inventory" className="cs-stretch">
						<div className="cs-inventory-box">
							{groups
								.filter((g) => g.items.length > 0)
								.map((g) => (
									<ItemGroup key={g.location} group={g} />
								))}
							<div className="cs-items cs-stretch">
								<div className="cs-items-head">
									<span className="cs-strong">Other items</span>
									<span className="cs-tiny cs-bulk-col">Bulk</span>
								</div>
								<Filler id="items" rowMm={ROW_MM.item}>
									{(n) =>
										times(n).map((i) => (
											<div key={i} className="cs-item">
												<span className="cs-item-name">{NBSP}</span>
												<span className="cs-bulk-col" />
											</div>
										))
									}
								</Filler>
							</div>
						</div>
					</Section>
					<Section title="Bulk">
						<div className="cs-bulk">
							<IconStat
								icon="bulk"
								value={formatBulk(bulk.carried)}
								className="cs-bulk-stat"
							/>
							<div className="cs-tiny">
								<div>
									<b>Light items</b> 10 light = 1 Bulk
								</div>
								<div>
									<b>Encumbered</b> over 5 + Str = {bulk.encumberedAt}
								</div>
								<div>
									<b>Maximum</b> 10 + Str = {bulk.max}
								</div>
								<div>
									<b>Maximum invested</b> 10
								</div>
							</div>
						</div>
					</Section>
					{itemDescriptions.length > 0 && (
						<Section title="Item descriptions">
							<div className="cs-side-descriptions">
								{itemDescriptions.map(({ key, title, entry }) => (
									<div key={key} className="cs-reference-entry">
										<b>{title}</b> {entry.text}
									</div>
								))}
							</div>
						</Section>
					)}
					<Section title="Wealth">
						<div className="cs-coins">
							{coins.map(([label, value]) => (
								<span key={label} className="cs-coin">
									<small>{label}</small>
									<span>{value}</span>
								</span>
							))}
						</div>
					</Section>
				</div>
			</div>
		</div>
	);
}

// --- Page 3: actions ----------------------------------------------------------

const ENCOUNTER_SECTIONS: { kind: CardKind; title: string }[] = [
	{ kind: 'action', title: 'Actions and activities' },
	{ kind: 'reaction', title: 'Free actions and reactions' },
];

const EXPLORATION_SECTIONS: { kind: CardKind; title: string }[] = [
	{ kind: 'exploration', title: 'Exploration and downtime activities' },
];

function ActionCardView({ card }: { card: ActionCard }) {
	const { entry } = card;

	return (
		<div className="cs-action-card">
			<div className="cs-action-head">
				<b>{entry.name}</b>
				{entry.actions && (
					<span className="cs-action-cost">
						<ActionGlyphs actions={entry.actions} />
					</span>
				)}
				<span className="cs-action-source">{entry.source}</span>
			</div>
			{(entry.traits.length > 0 || card.checks.length > 0) && (
				<div className="cs-action-meta">
					{card.checks.map((c) => (
						<span key={c} className="cs-action-check">
							{c}
						</span>
					))}
					{entry.traits.map((t) => (
						<span key={t} className="cs-tag">
							{t}
						</span>
					))}
					{entry.trained && <span className="cs-tag">Trained</span>}
				</div>
			)}
			{entry.frequency && (
				<div>
					<b>Frequency</b> {entry.frequency}
				</div>
			)}
			{entry.trigger && (
				<div>
					<b>Trigger</b> {entry.trigger}
				</div>
			)}
			{entry.requirements && (
				<div>
					<b>Requirements</b> {entry.requirements}
				</div>
			)}
			<div className="cs-action-text">{entry.text}</div>
			{card.modifiedBy.length > 0 && (
				<div className="cs-action-modified">
					See also: {card.modifiedBy.join(', ')}
				</div>
			)}
		</div>
	);
}

function BlankActionCard() {
	return (
		<div className="cs-action-card cs-action-blank">
			<div className="cs-row">
				<Box label="Name" className="cs-grow" value={NBSP} />
				<Box label="Actions" value={NBSP} />
				<Box label="Traits" className="cs-grow" value={NBSP} />
			</div>
			<Box label="Trigger / requirements" value={NBSP} />
			<Box label="Effect" className="cs-grow" />
		</div>
	);
}

// One page of action cards (encounter, or exploration and downtime), with
// blank cards filling the rest.
function ActionsPage({
	id,
	cards,
	sections,
	moreTitle,
	descriptions = [],
	replaceBlanks,
	extraCards,
}: {
	id: string;
	cards: ActionCard[];
	sections: { kind: CardKind; title: string }[];
	moreTitle: string;
	// Printed after the cards, before the blank ones.
	descriptions?: DescriptionOption[];
	// Shown instead of the blank cards (the spells).
	replaceBlanks?: ReactNode;
	// More cards after the card sections (spell texts), under their own title.
	extraCards?: { title: string; cards: ActionCard[] };
}) {
	// The heading over the blank cards shows only when some fit. It keeps its
	// space either way, so hiding it can't make room for a card and loop.
	const { counts } = useContext(FillContext);
	const hasBlanks = (counts[id] ?? 0) > 0;

	return (
		<div className="cs-page">
			<Measure id={`${id}-content`}>
				{sections.map(({ kind, title }) => {
					const list = cards.filter((c) => c.kind === kind);

					return list.length > 0 ? (
						<Section key={kind} title={title}>
							<div className="cs-action-grid">
								{list.map((c) => (
									<ActionCardView key={c.key} card={c} />
								))}
							</div>
						</Section>
					) : null;
				})}
				{extraCards && extraCards.cards.length > 0 && (
					<Section title={extraCards.title}>
						<div className="cs-action-grid">
							{extraCards.cards.map((c) => (
								<ActionCardView key={c.key} card={c} />
							))}
						</div>
					</Section>
				)}
				<DescriptionSections descriptions={descriptions} />
			</Measure>
			{replaceBlanks ?? (
				<Section
					title={moreTitle}
					className="cs-stretch"
					titleHidden={!hasBlanks}
				>
					<Filler id={id} rowMm={ROW_MM.actionRow} className="cs-blank-cards">
						{(n) => times(n * 2).map((i) => <BlankActionCard key={i} />)}
					</Filler>
				</Section>
			)}
		</div>
	);
}

// --- Spells (casters only), after the official sheet's page 4 -----------------

const TRADITIONS = ['arcane', 'occult', 'primal', 'divine'] as const;

function SpellName({ row }: { row: SpellRow }) {
	return (
		<>
			{row.name}
			{row.source && <span className="cs-tag">{row.source}</span>}
		</>
	);
}

function SpellTableHead({ rank = false }: { rank?: boolean }) {
	return (
		<div className={`cs-spell-row cs-spell-head ${rank ? 'cs-with-rank' : ''}`}>
			<span>Name</span>
			<span>Actions</span>
			{rank && <span>Rank</span>}
			<span>Prep</span>
		</div>
	);
}

function SpellRowView({
	row,
	info,
	rank = false,
}: {
	row?: SpellRow;
	info?: SpellInfo;
	rank?: boolean;
}) {
	return (
		<div className={`cs-spell-row ${rank ? 'cs-with-rank' : ''}`}>
			<span className="cs-spell-name">
				{row ? <SpellName row={row} /> : NBSP}
			</span>
			<span>
				{info?.actions ? <ActionGlyphs actions={info.actions} /> : ''}
			</span>
			{rank && <span>{row ? row.rank : ''}</span>}
			<span>
				<span className="cs-check-box" />
			</span>
		</div>
	);
}

// The spells layout: on its own page, or on the exploration page in place of
// the blank cards, where its blank rows shrink to the space left.
function SpellsContent({
	build,
	page,
	pageIndex,
	spellInfo,
	descriptions = [],
}: {
	build: PathbuilderBuild;
	page: SpellPage;
	pageIndex: number;
	spellInfo: Record<string, SpellInfo>;
	// Spell descriptions the player picked; this page prints its own spells'.
	descriptions?: DescriptionOption[];
}) {
	const info = (name: string) => spellInfo[name.toLowerCase()];
	const lowRank = Math.ceil(build.level / 2);
	const focusPoints = build.focusPoints ?? 0;
	// Spells split over two columns, as on the official sheet.
	const half = Math.ceil(page.spells.length / 2);
	const columns = [page.spells.slice(0, half), page.spells.slice(half)];
	const id = (part: string) => `spells-${pageIndex}-${part}`;

	const own = new Set(
		[
			...page.cantrips.map((r) => r.name),
			...page.spells.map((r) => r.name),
			...page.focusSpells,
			...page.innate.map((r) => r.name),
		].map((n) => n.toLowerCase())
	);
	const spellDescriptions = descriptions.filter((d) =>
		own.has(d.title.toLowerCase())
	);

	return (
		<>
			<div className="cs-spells-grid">
				<div className="cs-spells-left">
					<Section title="Magical tradition">
						<div className="cs-tradition">
							<div className="cs-tradition-names">
								{TRADITIONS.map((t) => (
									<span key={t} className={page.tradition === t ? 'cs-on' : ''}>
										{cap(t)}
									</span>
								))}
							</div>
							<div className="cs-caster-type">
								<span className={page.prepared ? 'cs-on' : ''}>
									Prepared caster
								</span>
								<span className={page.prepared ? '' : 'cs-on'}>
									Spontaneous caster
								</span>
							</div>
						</div>
					</Section>
					<Section title="Spell statistics">
						<div className="cs-spell-stats">
							<div>
								<span className="cs-stat-title">Spell attack</span>
								<div className="cs-perception">
									<span className="cs-total cs-total-big">
										{formatMod(page.attack)}
									</span>
									<Ranks rank={page.rank} />
									<Parts
										parts={[
											{ value: page.attackKey, label: 'Key' },
											{ value: page.attackProf, label: 'Prof' },
										]}
									/>
								</div>
							</div>
							<div>
								<span className="cs-stat-title">Spell DC</span>
								<div className="cs-perception">
									<span className="cs-total cs-total-big">{page.dc}</span>
									<Parts
										parts={[
											{ value: 10, label: 'Base' },
											{ value: page.attackKey, label: 'Key' },
											{ value: page.attackProf, label: 'Prof' },
										]}
									/>
								</div>
							</div>
						</div>
					</Section>
					<Section title="Cantrips" className="cs-spell-block cs-grow-2-flex">
						<div className="cs-row">
							<Box
								// Cantrips have no daily limit: this is how many are
								// prepared, or known by a spontaneous caster.
								label={page.prepared ? 'Cantrips prepared' : 'Cantrips known'}
								value={page.cantripsPerDay ?? NBSP}
							/>
							<Box label="Cantrip rank" value={lowRank} />
						</div>
						<div className="cs-spell-table">
							<SpellTableHead />
							{page.cantrips.map((r, i) => (
								<SpellRowView key={i} row={r} info={info(r.name)} />
							))}
							<Filler id={id('cantrips')} rowMm={ROW_MM.spell}>
								{(n) => times(n).map((i) => <SpellRowView key={i} />)}
							</Filler>
						</div>
					</Section>
					<Section title="Focus spells" className="cs-spell-block">
						<div className="cs-row cs-focus-head">
							<span className="cs-condition-label">Focus points</span>
							<span className="cs-focus-points">
								{times(3).map((i) => (
									<span key={i} className={i < focusPoints ? 'cs-on' : ''} />
								))}
							</span>
							<Box label="Focus spell rank" value={lowRank} />
						</div>
						<div className="cs-tiny">
							Focus pool: one point per focus spell (maximum 3). Refocus: 10
							minutes to regain 1 point.
						</div>
						<div className="cs-spell-table">
							<div className="cs-spell-row cs-spell-head cs-no-prep">
								<span>Name</span>
								<span>Actions</span>
							</div>
							{page.focusSpells.map((name, i) => (
								<div key={i} className="cs-spell-row cs-no-prep">
									<span className="cs-spell-name">{name}</span>
									<span>
										{info(name)?.actions ? (
											<ActionGlyphs actions={info(name).actions} />
										) : (
											''
										)}
									</span>
								</div>
							))}
							<Filler id={id('focus')} rowMm={ROW_MM.spell}>
								{(n) =>
									times(n).map((i) => (
										<div key={i} className="cs-spell-row cs-no-prep">
											<span>{NBSP}</span>
											<span />
										</div>
									))
								}
							</Filler>
						</div>
					</Section>
					<Section title="Innate spells" className="cs-spell-block">
						<div className="cs-spell-table">
							<div className="cs-spell-row cs-spell-head cs-innate">
								<span>Name</span>
								<span>Actions</span>
								<span>Freq</span>
							</div>
							{page.innate.map((sp, i) => (
								<div key={i} className="cs-spell-row cs-innate">
									<span className="cs-spell-name">{sp.name}</span>
									<span>
										{info(sp.name)?.actions ? (
											<ActionGlyphs actions={info(sp.name).actions} />
										) : (
											''
										)}
									</span>
									<span>{sp.frequency}</span>
								</div>
							))}
							<Filler id={id('innate')} rowMm={ROW_MM.spell}>
								{(n) =>
									times(n).map((i) => (
										<div key={i} className="cs-spell-row cs-innate">
											<span>{NBSP}</span>
											<span />
											<span />
										</div>
									))
								}
							</Filler>
						</div>
					</Section>
				</div>
				<div className="cs-spells-right">
					<Section title="Spell slots">
						<div className="cs-slots">
							<span className="cs-slots-label">Spells per day</span>
							{page.slots.map((n, i) => (
								<span key={`d${i}`} className="cs-slot-box">
									{n || NBSP}
								</span>
							))}
							<span className="cs-slots-label cs-strong">Spell rank</span>
							{page.slots.map((_, i) => (
								<b key={`r${i}`} className="cs-slot-rank">
									{i + 1}
								</b>
							))}
							<span className="cs-slots-label">Spells remaining</span>
							{page.slots.map((_, i) => (
								<span key={`l${i}`} className="cs-slot-box">
									{NBSP}
								</span>
							))}
						</div>
					</Section>
					<Section title="Spells" className="cs-stretch">
						<div className="cs-spell-columns">
							{columns.map((col, c) => (
								<div key={c} className="cs-spell-table">
									<SpellTableHead rank />
									{col.map((r, i) => (
										<SpellRowView key={i} row={r} info={info(r.name)} rank />
									))}
									<Filler id={id(`spells-${c}`)} rowMm={ROW_MM.spell}>
										{(n) => times(n).map((i) => <SpellRowView key={i} rank />)}
									</Filler>
								</div>
							))}
						</div>
					</Section>
					<Section title="Rituals">
						<div className="cs-spell-columns">
							{times(2).map((c) => (
								<div key={c} className="cs-spell-table">
									<div className="cs-spell-row cs-spell-head cs-ritual">
										<span>Name</span>
										<span>Rank</span>
										<span>Cost</span>
									</div>
									{times(4).map((i) => (
										<div key={i} className="cs-spell-row cs-ritual">
											<span>{NBSP}</span>
											<span />
											<span />
										</div>
									))}
								</div>
							))}
						</div>
					</Section>
				</div>
			</div>
			{spellDescriptions.length > 0 && (
				<DescriptionSections descriptions={spellDescriptions} />
			)}
		</>
	);
}

function SpellsPage(props: Parameters<typeof SpellsContent>[0]) {
	return (
		<div className="cs-page cs-spells-page">
			<SpellsContent {...props} />
		</div>
	);
}

// --- Last page: notes ----------------------------------------------------------

type NotesBuild = PathbuilderBuild & {
	age?: string;
	gender?: string;
	deity?: string;
};

// The notes in less space, under the feats and inventory of a low-level
// character.
function CompactNotes({ build }: { build: PathbuilderBuild }) {
	const b = build as NotesBuild;

	return (
		<div className="cs-compact-notes">
			<div className="cs-compact-col">
				<Section title="Origin and appearance">
					<div className="cs-row">
						<Box label="Ethnicity" className="cs-grow" value={NBSP} />
						<Box label="Nationality" className="cs-grow" value={NBSP} />
						<Box label="Birthplace" className="cs-grow" value={NBSP} />
					</div>
					<div className="cs-row">
						<Box
							label="Age"
							className="cs-grow"
							value={setValue(b.age) ?? NBSP}
						/>
						<Box
							label="Gender & pronouns"
							className="cs-grow"
							value={setValue(b.gender) ?? NBSP}
						/>
						<Box label="Height" className="cs-grow" value={NBSP} />
						<Box label="Weight" className="cs-grow" value={NBSP} />
					</div>
					<Box label="Appearance" className="cs-tall" />
				</Section>
				<Section title="Personality" className="cs-stretch">
					<div className="cs-row">
						<Box label="Attitude" className="cs-grow" value={NBSP} />
						<Box
							label="Deity or philosophy"
							className="cs-grow"
							value={setValue(b.deity) ?? NBSP}
						/>
					</div>
					<div className="cs-row cs-stretch">
						<Box label="Edicts" className="cs-grow" />
						<Box label="Anathema" className="cs-grow" />
					</div>
					<Box label="Likes and dislikes" className="cs-tall" />
				</Section>
			</div>
			<div className="cs-compact-col">
				<Section title="Backstory" className="cs-stretch">
					<Box className="cs-fill" />
				</Section>
				<Section title="Campaign notes" className="cs-stretch">
					<div className="cs-campaign">
						<Box label="Notes" className="cs-fill" />
						<div className="cs-campaign-side">
							<Box label="Allies" className="cs-fill" />
							<Box label="Enemies" className="cs-fill" />
							<Box label="Organizations" className="cs-fill" />
						</div>
					</div>
				</Section>
			</div>
		</div>
	);
}

// --- Descriptions the player picked ---------------------------------------------

function DescriptionEntry({ option }: { option: DescriptionOption }) {
	const { title, entry } = option;

	return (
		<div className="cs-reference-entry">
			<div className="cs-action-head">
				<b>{title}</b>
				{entry.kind && <span className="cs-tag">{entry.kind}</span>}
				<span className="cs-action-source">{entry.source}</span>
			</div>
			<div>{entry.text}</div>
		</div>
	);
}

function DescriptionSections({
	descriptions,
}: {
	descriptions: DescriptionOption[];
}) {
	const sections = (Object.keys(DESCRIPTION_GROUP_TITLES) as DescriptionGroup[])
		.map((group) => ({
			group,
			list: descriptions.filter((d) => d.group === group),
		}))
		.filter(({ list }) => list.length > 0);

	// Two sections in a row that hold one entry each share a row, so a single
	// entry doesn't leave half the width empty.
	const rows: (typeof sections)[] = [];

	for (const section of sections) {
		const last = rows.at(-1);

		if (
			section.list.length === 1 &&
			last?.length === 1 &&
			last[0].list.length === 1
		)
			last.push(section);
		else rows.push([section]);
	}

	return (
		<>
			{rows.map((row) =>
				row.length === 2 ? (
					<div key={row[0].group} className="cs-section-pair">
						{row.map(({ group, list }) => (
							<Section key={group} title={DESCRIPTION_GROUP_TITLES[group]}>
								<DescriptionEntry option={list[0]} />
							</Section>
						))}
					</div>
				) : (
					<Section
						key={row[0].group}
						title={DESCRIPTION_GROUP_TITLES[row[0].group]}
					>
						<div className="cs-reference">
							{row[0].list.map((option) => (
								<DescriptionEntry key={option.key} option={option} />
							))}
						</div>
					</Section>
				)
			)}
		</>
	);
}

function NotesPage({ build }: { build: PathbuilderBuild }) {
	const b = build as NotesBuild;

	return (
		<div className="cs-page cs-notes-page">
			<div className="cs-page3-top">
				<Section title="Character sketch">
					<div className="cs-sketch" />
				</Section>
				<div>
					<Section title="Origin and appearance">
						<div className="cs-row">
							<Box label="Ethnicity" className="cs-grow" value={NBSP} />
							<Box label="Nationality" className="cs-grow" value={NBSP} />
							<Box label="Birthplace" className="cs-grow" value={NBSP} />
							<Box label="Age" value={setValue(b.age) ?? NBSP} />
							<Box
								label="Gender & pronouns"
								value={setValue(b.gender) ?? NBSP}
							/>
							<Box label="Height" value={NBSP} />
							<Box label="Weight" value={NBSP} />
						</div>
						<Box label="Appearance" className="cs-tall-2" />
					</Section>
					<Section title="Personality">
						<div className="cs-row">
							<Box label="Attitude" className="cs-grow-2" value={NBSP} />
							<Box
								label="Deity or philosophy"
								className="cs-grow"
								value={setValue(b.deity) ?? NBSP}
							/>
						</div>
						<div className="cs-row">
							<Box label="Edicts" className="cs-grow cs-tall-2" />
							<Box label="Anathema" className="cs-grow cs-tall-2" />
						</div>
						<Box label="Likes" className="cs-tall" />
						<Box label="Dislikes" className="cs-tall" />
						<Box label="Catchphrases" className="cs-tall" />
					</Section>
				</div>
			</div>
			<Section title="Backstory">
				<Box className="cs-backstory" />
			</Section>
			<Section title="Campaign notes" className="cs-stretch">
				<div className="cs-campaign">
					<Box label="Notes" className="cs-fill" />
					<div className="cs-campaign-side">
						<Box label="Allies" className="cs-fill" />
						<Box label="Enemies" className="cs-fill" />
						<Box label="Organizations" className="cs-fill" />
					</div>
				</div>
			</Section>
		</div>
	);
}

export function CharacterSheet({
	build,
	sheet,
	items,
	cards,
	origin,
	descriptions,
	mergeNotes,
	levelCount,
	spellInfo,
	spellsOnExploration,
	spellTextOnActions,
	fill,
}: {
	build: PathbuilderBuild;
	sheet: DerivedSheet;
	items: ResolvedItem[];
	cards: ActionCard[];
	origin: OriginInfo;
	// Descriptions the player chose for the reference page.
	descriptions: DescriptionOption[];
	// Put the notes on the feats and inventory page (low-level characters).
	mergeNotes: boolean;
	levelCount: number;
	// Action cost and rank by lower-case spell name.
	spellInfo: Record<string, SpellInfo>;
	// Spells on the exploration page instead of its blank cards.
	spellsOnExploration: boolean;
	// Chosen spell texts as cards on the actions page, not under the spells.
	spellTextOnActions: boolean;
	fill: FillApi;
}) {
	const spells = spellPages(build);
	// Spells go on the exploration page only when they fit there.
	const embedSpells =
		spellsOnExploration && !!spells[0] && spellsFitOnExploration(fill.counts);
	const spellDescriptions = descriptions.filter((d) => d.group === 'spell');
	// The same spell texts as cards for the actions page: action cost, traits
	// and rank from the spell data, text from the description.
	const spellCards: ActionCard[] = spellDescriptions.map((d) => {
		const info = spellInfo[d.title.toLowerCase()];

		return {
			key: d.key,
			entry: {
				name: d.title,
				actions: info?.actions ?? '',
				traits: info?.traits ?? [],
				text: d.entry.text,
				source: d.entry.source,
			},
			kind: 'action',
			checks: info?.rank
				? [info.traits.includes('Cantrip') ? 'Cantrip' : `Rank ${info.rank}`]
				: [],
			modifiedBy: [],
		};
	});
	// Attachment names per weapon, by its index in the export.
	const weaponAttachments: string[][] = [];

	for (const item of items) {
		if (item.weaponIndex !== undefined)
			weaponAttachments[item.weaponIndex] = item.attachments.map((a) => a.name);
	}

	return (
		<FillContext.Provider value={fill}>
			<div className="cs-sheet">
				<PageOne
					build={build}
					sheet={sheet}
					origin={origin}
					weaponAttachments={weaponAttachments}
				/>
				<PageTwo
					build={build}
					sheet={sheet}
					items={items}
					withNotes={mergeNotes}
					levelCount={levelCount}
					itemDescriptions={descriptions.filter((d) => d.group === 'item')}
				/>
				<ActionsPage
					id="encounter-actions"
					cards={cards}
					sections={ENCOUNTER_SECTIONS}
					moreTitle="More actions"
					extraCards={
						spellTextOnActions
							? { title: 'Spells', cards: spellCards }
							: undefined
					}
				/>
				<ActionsPage
					id="exploration-actions"
					cards={cards}
					sections={EXPLORATION_SECTIONS}
					moreTitle="More exploration and downtime activities"
					descriptions={descriptions.filter(
						(d) => d.group !== 'item' && d.group !== 'spell'
					)}
					replaceBlanks={
						embedSpells ? (
							<SpellsContent
								build={build}
								page={spells[0]}
								pageIndex={0}
								spellInfo={spellInfo}
								descriptions={spellTextOnActions ? [] : spellDescriptions}
							/>
						) : undefined
					}
				/>
				{spells.slice(embedSpells ? 1 : 0).map((page, i) => (
					<SpellsPage
						key={i}
						build={build}
						page={page}
						pageIndex={i + (embedSpells ? 1 : 0)}
						spellInfo={spellInfo}
						descriptions={spellTextOnActions ? [] : spellDescriptions}
					/>
				))}
				{!mergeNotes && <NotesPage build={build} />}
			</div>
		</FillContext.Provider>
	);
}

export type { FillApi };
