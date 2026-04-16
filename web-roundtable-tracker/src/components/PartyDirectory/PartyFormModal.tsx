import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Party, PartyIcon, PARTY_ICONS } from '@/store/savedParties';
import { IconPicker } from './PartyCard';
import { generateUUID } from '@/utils/uuid';
import { cn } from '@/lib/utils';

export type PartyFormValues = {
	name: string;
	icon: PartyIcon;
	members: Array<{
		uuid: string;
		name: string;
		level: number | undefined;
		maxHealth: number | undefined;
		tiePriority: boolean;
		class: string;
		ancestry: string;
		ac: number | undefined;
	}>;
};

type PartyFormModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialParty?: Party;
	mode: 'create' | 'edit' | 'copy';
	onSubmit: (id: string, values: PartyFormValues) => void;
};

const defaultMember = (): PartyFormValues['members'][number] => ({
	uuid: generateUUID(),
	name: '',
	level: undefined,
	maxHealth: undefined,
	tiePriority: true,
	class: '',
	ancestry: '',
	ac: undefined,
});

const partyToFormValues = (party: Party): PartyFormValues => ({
	name: party.name,
	icon: party.icon,
	members: party.members.map((m) => ({
		uuid: m.uuid,
		name: m.name,
		level: m.level,
		maxHealth: m.maxHealth,
		tiePriority: m.tiePriority,
		class: m.class ?? '',
		ancestry: m.ancestry ?? '',
		ac: m.ac,
	})),
});

export function PartyFormModal({ open, onOpenChange, initialParty, mode, onSubmit }: PartyFormModalProps) {
	const formId = mode === 'edit' && initialParty ? initialParty.id : generateUUID();

	const { control, register, handleSubmit, reset, formState: { errors } } = useForm<PartyFormValues>({
		mode: 'onChange',
		defaultValues: initialParty
			? partyToFormValues(initialParty)
			: { name: '', icon: 'Users', members: [defaultMember()] },
	});

	const { fields, append, remove } = useFieldArray({ control, name: 'members' });

	useEffect(() => {
		if (open) {
			if (initialParty) {
				const values = partyToFormValues(initialParty);

				if (mode === 'copy') {
					values.name = `${values.name} (Copy)`;
					// give each member a fresh uuid so copy is independent
					values.members = values.members.map((m) => ({ ...m, uuid: generateUUID() }));
				}

				reset(values);
			} else {
				reset({ name: '', icon: 'Users', members: [defaultMember()] });
			}
		}
	}, [open, initialParty, mode, reset]);

	const handleFormSubmit = handleSubmit((data) => {
		onSubmit(formId, data);
		onOpenChange(false);
	});

	const titleMap = { create: 'New Party', edit: 'Edit Party', copy: 'Copy Party' };


	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
				<DialogHeader className="border-b px-6 py-5">
					<DialogTitle>{titleMap[mode]}</DialogTitle>
				</DialogHeader>

				<form
					id="party-form"
					onSubmit={handleFormSubmit}
					className="flex-1 overflow-y-auto px-6 py-5"
				>
					<div className="space-y-6">
						{/* Name */}
						<div className="space-y-1.5">
							<Label htmlFor="party-name">Party Name</Label>
							<Input
								id="party-name"
								placeholder="e.g. The Ironfall Company"
								className={cn(errors.name && 'border-destructive bg-destructive/10')}
								{...register('name', { required: 'Name is required' })}
							/>
							{errors.name && (
								<p className="text-xs text-destructive">{errors.name.message}</p>
							)}
						</div>

						{/* Icon Picker */}
						<div className="space-y-1.5">
							<Label>Icon</Label>
							<Controller
								control={control}
								name="icon"
								render={({ field }) => (
									<IconPicker
										value={field.value ?? PARTY_ICONS[0]}
										onChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* Members */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-base">Members</Label>
								<button
									type="button"
									onClick={() => append(defaultMember())}
									className="text-sm font-medium text-primary hover:underline"
								>
									+ Add Member
								</button>
							</div>

							{fields.map((field, index) => (
								<div key={field.id} className="rounded-lg border bg-card p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-muted-foreground">
											Member {index + 1}
										</span>
										{fields.length > 1 && (
											<button
												type="button"
												onClick={() => remove(index)}
												className="text-xs text-destructive hover:underline"
											>
												Remove
											</button>
										)}
									</div>

									{/* Row 1: Name + Level + MaxHP */}
									<div className="flex flex-wrap gap-3">
										<div className="min-w-40 flex-1 space-y-1">
											<Label htmlFor={`member-name-${index}`} className="text-xs">
												Name <span className="text-destructive">*</span>
											</Label>
											<Input
												id={`member-name-${index}`}
												placeholder="Character name"
												className={cn(
													'h-8',
													errors.members?.[index]?.name && 'border-destructive bg-destructive/10'
												)}
												{...register(`members.${index}.name`, { required: 'Required' })}
											/>
										</div>
										<div className="w-20 space-y-1">
											<Label htmlFor={`member-level-${index}`} className="text-xs">
												Level <span className="text-destructive">*</span>
											</Label>
											<Input
												id={`member-level-${index}`}
												type="number"
												min={-1}
												step={1}
												placeholder="1"
												className={cn(
													'h-8 text-center',
													errors.members?.[index]?.level && 'border-destructive bg-destructive/10'
												)}
												{...register(`members.${index}.level`, {
													required: 'Required',
													valueAsNumber: true,
													validate: (v) => (v !== undefined && !isNaN(v as number)) || 'Required',
												})}
											/>
										</div>
										<div className="w-24 space-y-1">
											<Label htmlFor={`member-hp-${index}`} className="text-xs">
												Max HP <span className="text-destructive">*</span>
											</Label>
											<Input
												id={`member-hp-${index}`}
												type="number"
												min={0}
												step={1}
												placeholder="20"
												className={cn(
													'h-8 text-center',
													errors.members?.[index]?.maxHealth && 'border-destructive bg-destructive/10'
												)}
												{...register(`members.${index}.maxHealth`, {
													required: 'Required',
													valueAsNumber: true,
													validate: (v) =>
														(v !== undefined && !isNaN(v as number) && (v as number) >= 0) ||
														'Must be ≥ 0',
												})}
											/>
										</div>
									</div>

									{/* Row 2: Class + Ancestry + AC */}
									<div className="flex flex-wrap gap-3">
										<div className="min-w-28 flex-1 space-y-1">
											<Label htmlFor={`member-class-${index}`} className="text-xs">
												Class
											</Label>
											<Input
												id={`member-class-${index}`}
												placeholder="Fighter"
												className="h-8"
												{...register(`members.${index}.class`)}
											/>
										</div>
										<div className="min-w-28 flex-1 space-y-1">
											<Label htmlFor={`member-ancestry-${index}`} className="text-xs">
												Ancestry
											</Label>
											<Input
												id={`member-ancestry-${index}`}
												placeholder="Human"
												className="h-8"
												{...register(`members.${index}.ancestry`)}
											/>
										</div>
										<div className="w-20 space-y-1">
											<Label htmlFor={`member-ac-${index}`} className="text-xs">
												AC
											</Label>
											<Input
												id={`member-ac-${index}`}
												type="number"
												min={0}
												step={1}
												placeholder="16"
												className="h-8 text-center"
												{...register(`members.${index}.ac`, {
													setValueAs: (v) =>
														v === '' || v === undefined ? undefined : Number(v),
												})}
											/>
										</div>
									</div>

									{/* Row 3: Tie Priority */}
									<label className="flex cursor-pointer items-center gap-2 text-sm">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border-border"
											{...register(`members.${index}.tiePriority`)}
										/>
										<span>Initiative tie advantage</span>
									</label>
								</div>
							))}

							{fields.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No members yet. Click "+ Add Member" to add one.
								</p>
							)}
						</div>
					</div>
				</form>

				<DialogFooter className="border-t px-6 py-4">
					<Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button type="submit" form="party-form">
						{mode === 'edit' ? 'Save Changes' : 'Create Party'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
