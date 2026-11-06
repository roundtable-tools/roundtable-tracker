import { ActionGlyphs } from './CharacterSheet';
import { isChosen, type ActionChoices, type ActionOption } from './actions';
import { formatMod, type DerivedSheet } from './pathbuilder';

type Props = {
	options: ActionOption[];
	choices: ActionChoices;
	sheet: DerivedSheet;
	onToggle: (key: string, on: boolean) => void;
};

function OptionList({
	options,
	choices,
	onToggle,
	trainedOk = true,
}: Omit<Props, 'sheet'> & { trainedOk?: boolean }) {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-4 gap-y-1">
			{options.map((o) => (
				<label key={o.key} className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={isChosen(o, choices)}
						onChange={(e) => onToggle(o.key, e.target.checked)}
					/>
					<span>
						{o.entry.name}
						{o.entry.actions && (
							<span className="text-muted-foreground ml-1">
								<ActionGlyphs actions={o.entry.actions} />
							</span>
						)}
						{o.modifiedBy.length > 0 && (
							<span className="text-muted-foreground ml-1 text-xs">
								({o.modifiedBy.join(', ')})
							</span>
						)}
						{o.entry.trained && (
							<span
								className={`ml-1 text-xs ${trainedOk ? 'text-muted-foreground' : 'text-destructive'}`}
							>
								trained
							</span>
						)}
					</span>
				</label>
			))}
		</div>
	);
}

export function ActionPicker({ options, choices, sheet, onToggle }: Props) {
	const feats = options.filter((o) => o.group === 'feat');
	const exploration = options.filter((o) => o.group === 'exploration');
	const basic = options.filter((o) => o.group === 'basic');
	const picked = (list: ActionOption[]) =>
		list.filter((o) => isChosen(o, choices)).length;

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h3 className="mb-1 text-sm font-medium">
					From your feats and features
				</h3>
				{feats.length > 0 ? (
					<OptionList options={feats} choices={choices} onToggle={onToggle} />
				) : (
					<p className="text-muted-foreground text-sm">
						None of this character’s feats take an action.
					</p>
				)}
			</div>
			<div>
				<h3 className="mb-1 text-sm font-medium">Exploration activities</h3>
				<OptionList
					options={exploration}
					choices={choices}
					onToggle={onToggle}
				/>
			</div>
			<div>
				<h3 className="mb-1 text-sm font-medium">Skill actions</h3>
				<div className="flex flex-col gap-1">
					{sheet.skills.map((skill) => {
						const list = options.filter(
							(o) => o.group === 'skill' && o.skill === skill.key
						);
						const count = picked(list);

						return (
							<details key={skill.key} className="rounded-md border px-3 py-1">
								<summary className="cursor-pointer text-sm">
									{skill.label} {formatMod(skill.total)}
									{skill.rank === 0 && (
										<span className="text-muted-foreground"> · untrained</span>
									)}
									{count > 0 && (
										<span className="text-muted-foreground">
											{' '}
											· {count} picked
										</span>
									)}
								</summary>
								<div className="py-2">
									<OptionList
										options={list}
										choices={choices}
										onToggle={onToggle}
										trainedOk={skill.rank > 0}
									/>
								</div>
							</details>
						);
					})}
				</div>
			</div>
			<details className="rounded-md border px-3 py-1">
				<summary className="cursor-pointer text-sm font-medium">
					Basic actions
					{picked(basic) > 0 && (
						<span className="text-muted-foreground font-normal">
							{' '}
							· {picked(basic)} picked
						</span>
					)}
				</summary>
				<div className="py-2">
					<OptionList options={basic} choices={choices} onToggle={onToggle} />
				</div>
			</details>
		</div>
	);
}
