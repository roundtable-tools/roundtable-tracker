import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { PARTICIPANT_DC_ICON_KEYS } from '@/store/data';
import type { ParticipantDcIconKey } from '@/store/data';
import type { SkillChallengeDC } from '@/models/encounters/skillChallenge.types';
import { X } from 'lucide-react';

interface DcPickerProps {
	dcs: SkillChallengeDC[];
	onDcsChange: (dcs: SkillChallengeDC[]) => void;
}

const ICON_LABELS: Record<ParticipantDcIconKey, string> = {
	shield: 'Shield',
	sword: 'Sword',
	eye: 'Eye',
	sparkles: 'Sparkles',
	'triangle-alert': 'Alert',
	target: 'Target',
};

export function DcPicker({ dcs, onDcsChange }: DcPickerProps) {
	const [open, setOpen] = useState(false);
	const [formName, setFormName] = useState('');
	const [formValue, setFormValue] = useState(10);
	const [formIcon, setFormIcon] = useState<ParticipantDcIconKey>('shield');

	const handleAdd = () => {
		if (!formName.trim()) {
			return;
		}

		const newDC: SkillChallengeDC = {
			name: formName.trim(),
			value: formValue,
			icon: formIcon,
		};

		onDcsChange([...dcs, newDC]);

		// Reset form
		setFormName('');
		setFormValue(10);
		setFormIcon('shield');
		setOpen(false);
	};

	const handleRemove = (index: number) => {
		onDcsChange(dcs.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-2">
				{dcs.map((dc, index) => (
					<div
						key={index}
						className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
					>
						<span className="text-xs text-gray-600 dark:text-gray-400">
							{ICON_LABELS[dc.icon as ParticipantDcIconKey] || dc.icon}
						</span>
						<span className="font-medium">{dc.value}</span>
						<span className="text-gray-700 dark:text-gray-300">{dc.name}</span>
						<button
							type="button"
							onClick={() => handleRemove(index)}
							className="ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
						>
							<X className="size-3" />
						</button>
					</div>
				))}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<Button type="button" size="sm" onClick={() => setOpen(true)}>
					Add DC
				</Button>

				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Add Difficulty Class</DialogTitle>
						<DialogDescription>
							Configure a DC for this skill challenge
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium">Name</label>
							<Input
								type="text"
								placeholder="e.g., Acrobatics"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								className="mt-1"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium">DC Value</label>
							<div className="flex gap-2">
								<Input
									type="number"
									min={1}
									max={30}
									value={formValue}
									onChange={(e) => setFormValue(Number(e.target.value))}
									className="mt-1 flex-1"
								/>
								<span className="flex items-end pb-2 text-lg font-bold">
									{formValue}
								</span>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium">Icon</label>
							<Select value={formIcon} onValueChange={(value: ParticipantDcIconKey) => setFormIcon(value)}>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PARTICIPANT_DC_ICON_KEYS.map((icon) => (
										<SelectItem key={icon} value={icon}>
											{ICON_LABELS[icon]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={handleAdd} disabled={!formName.trim()}>
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
