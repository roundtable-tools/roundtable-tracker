import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Shield,
	Sword,
	Eye,
	Sparkles,
	TriangleAlert,
	Target,
	Trash2,
	type LucideIcon,
} from 'lucide-react';
import type { BuilderSlot } from '../builderXp';
import type { ParticipantDcEntry } from '@/store/data';
import { PARTICIPANT_DC_ICON_KEYS } from '@/store/data';

const DC_ICON_OPTIONS = PARTICIPANT_DC_ICON_KEYS.map((key) => ({
	value: key,
	label: key
		.split('-')
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(' '),
}));

const DC_NAME_SUGGESTIONS = [
	'Armor',
	'Reflex',
	'Fortitude',
	'Will',
	'Spellcasting',
	'Acrobatics',
	'Arcana',
	'Athletics',
	'Crafting',
	'Deception',
	'Diplomacy',
	'Intimidation',
	'Lore',
	'Medicine',
	'Nature',
	'Occultism',
	'Performance',
	'Religion',
	'Society',
	'Stealth',
	'Survival',
	'Thievery',
] as const;

function getIconComponent(iconKey: string): LucideIcon | null {
	const iconMap: Record<string, LucideIcon> = {
		shield: Shield,
		sword: Sword,
		eye: Eye,
		sparkles: Sparkles,
		'triangle-alert': TriangleAlert,
		target: Target,
	};
	return iconMap[iconKey] || null;
}

interface DCNameComboboxProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

function DCNameCombobox({ value, onChange, placeholder = 'Select or type name' }: DCNameComboboxProps) {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState(value);

	const filtered = DC_NAME_SUGGESTIONS.filter((name) =>
		name.toLowerCase().includes(inputValue.toLowerCase())
	);

	return (
		<div className="relative w-full">
			<Input
				placeholder={placeholder}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onFocus={() => setOpen(true)}
				onBlur={() => setTimeout(() => setOpen(false), 200)}
			/>
			{open && (
				<div className="absolute top-full z-50 w-full mt-1 border rounded-md bg-popover p-1 shadow-md">
					{filtered.length > 0 ? (
						<div className="space-y-1 max-h-48 overflow-y-auto">
							{filtered.map((name) => (
								<button
									key={name}
									type="button"
									className="w-full text-left px-2 py-1 rounded text-sm hover:bg-muted hover:text-foreground cursor-pointer"
									onClick={() => {
										onChange(name);
										setInputValue(name);
										setOpen(false);
									}}
								>
									{name}
								</button>
							))}
						</div>
					) : (
						<div className="px-2 py-1 text-xs text-muted-foreground">
							No suggestions found
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface DcsTabProps {
	index: number;
	slot: BuilderSlot;
	slotType: string;
	setValue: (path: string, value: any, options: any) => void;
	onRemove: () => void;
}

export function DcsTab({ index, slot, slotType, setValue, onRemove }: DcsTabProps) {
	return (
		<TabsContent value="dcs" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium">DCs</p>
				<Button
					className="ml-auto"
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						const nextDcs: ParticipantDcEntry[] = [
							...(slot.dcs ?? []),
							{ name: '', value: 10 },
						];
						setValue(`slots.${index}.dcs`, nextDcs, {
							shouldDirty: true,
							shouldTouch: true,
						});
					}}
				>
					Add DC
				</Button>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove DCs section"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			{(slot.dcs ?? []).map((dc, dcIndex) => (
				<div
					key={`dc-${index}-${dcIndex}`}
					className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-2 lg:grid-cols-5"
				>
					<DCNameCombobox
						value={dc.name ?? dc.inline ?? ''}
						onChange={(value) => {
							const nextDcs = [...(slot.dcs ?? [])];
							nextDcs[dcIndex] = {
								...nextDcs[dcIndex],
								name: value,
							};
							setValue(`slots.${index}.dcs`, nextDcs, {
								shouldDirty: true,
								shouldTouch: true,
							});
						}}
						placeholder="Name"
					/>
					<Input
						type="number"
						placeholder="Value"
						value={dc.value ?? ''}
						onChange={(event) => {
							const nextDcs = [...(slot.dcs ?? [])];
							nextDcs[dcIndex] = {
								...nextDcs[dcIndex],
								value: Number(event.target.value || 0),
							};
							setValue(`slots.${index}.dcs`, nextDcs, {
								shouldDirty: true,
								shouldTouch: true,
							});
						}}
					/>
					<Select
						value={dc.icon ?? '__none__'}
						onValueChange={(value) => {
							const nextDcs = [...(slot.dcs ?? [])];
							nextDcs[dcIndex] = {
								...nextDcs[dcIndex],
								icon: value === '__none__' ? undefined : value,
							};
							setValue(`slots.${index}.dcs`, nextDcs, {
								shouldDirty: true,
								shouldTouch: true,
							});
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Icon" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__none__">No icon</SelectItem>
							{DC_ICON_OPTIONS.map((option) => {
								const IconComponent = getIconComponent(option.value);
								return (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex items-center gap-2">
											{IconComponent && <IconComponent className="h-4 w-4" />}
											{option.label}
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					{slotType === 'hazard' ? (
						<Input
							type="number"
							min={1}
							placeholder="Disable Successes"
							value={dc.disableSuccesses ?? ''}
							onChange={(event) => {
								const nextDcs = [...(slot.dcs ?? [])];
								nextDcs[dcIndex] = {
									...nextDcs[dcIndex],
									disableSuccesses:
										event.target.value === ''
											? undefined
											: Number(event.target.value),
								};
								setValue(`slots.${index}.dcs`, nextDcs, {
									shouldDirty: true,
									shouldTouch: true,
								});
							}}
						/>
					) : (
						<div />
					)}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							const nextDcs = (slot.dcs ?? []).filter((_, idx) => idx !== dcIndex);
							setValue(`slots.${index}.dcs`, nextDcs, {
								shouldDirty: true,
								shouldTouch: true,
							});
						}}
					>
						Remove
					</Button>
				</div>
			))}
		</TabsContent>
	);
}
