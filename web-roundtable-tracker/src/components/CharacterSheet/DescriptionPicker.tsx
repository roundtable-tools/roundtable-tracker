import {
	DESCRIPTION_GROUP_TITLES,
	isDescriptionChosen,
	type DescriptionChoices,
	type DescriptionGroup,
	type DescriptionOption,
} from './reference';

type Props = {
	options: DescriptionOption[];
	choices: DescriptionChoices;
	onToggle: (key: string, on: boolean) => void;
};

export function DescriptionPicker({ options, choices, onToggle }: Props) {
	return (
		<div className="flex flex-col gap-4">
			{(Object.keys(DESCRIPTION_GROUP_TITLES) as DescriptionGroup[]).map(
				(group) => {
					const list = options.filter((o) => o.group === group);

					return list.length > 0 ? (
						<div key={group}>
							<h3 className="mb-1 text-sm font-medium">
								{DESCRIPTION_GROUP_TITLES[group]}
							</h3>
							<div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-4 gap-y-1">
								{list.map((o) => (
									<label
										key={o.key}
										className="flex items-center gap-2 text-sm"
										title={o.entry.text}
									>
										<input
											type="checkbox"
											checked={isDescriptionChosen(o, choices)}
											onChange={(e) => onToggle(o.key, e.target.checked)}
										/>
										<span>{o.title}</span>
									</label>
								))}
							</div>
						</div>
					) : null;
				}
			)}
		</div>
	);
}
