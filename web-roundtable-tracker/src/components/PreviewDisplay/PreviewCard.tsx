import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Inputs } from './PreviewDisplay';
import { UseFormGetFieldState, UseFormRegister } from 'react-hook-form';
import { adjustedLevel, CharacterConfig, formatAdjustedLevel } from '@/store/data';
import { Activity, Heart, ShieldPlus } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type InitiativeCardProps = {
	borderClassName: string;
	markerClassName: string;
	teamIndex: number;
	sideTitle: ReactNode;
	sideFlag: ReactNode;
	participants: CharacterConfig[];
	register: UseFormRegister<Inputs>;
	getFieldState: UseFormGetFieldState<Inputs>;
	/** Fields to render as read-only display text instead of inputs */
	readonlyFields?: Array<'name' | 'level'>;
};

type NumberKeys<T> = {
	[K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type NumberKeysWithoutUndefined = Exclude<
	NumberKeys<CharacterConfig>,
	undefined
>;

const NumberInput = ({
	name,
	register,
	getFieldState,
}: {
	name: `teams.${number}.characters.${number}.${NumberKeysWithoutUndefined}`;
	register: UseFormRegister<Inputs>;
	getFieldState: UseFormGetFieldState<Inputs>;
}) => {
	const filed = getFieldState(name);

	return (
		<Input
			type="number"
			min={0}
			step={1}
			className={cn(
				'h-8 w-14 px-2 text-center tabular-nums',
				filed.invalid && 'border-destructive bg-destructive/10'
			)}
			aria-invalid={filed.invalid || undefined}
			{...register(name, {
				setValueAs: (value) => {
					if (value === '' || value === undefined || value === null) {
						return undefined;
					}

					return Number(value);
				},
				validate: {
					isNumber: (value) => {
						if (value === undefined) {
							return true;
						}

						if (isNaN(value)) {
							return 'Value must be a number';
						}

						if (value < 0) {
							return 'Value must be zero or greater';
						}

						return true;
					},
				},
			})}
		/>
	);
};

export const PreviewCard = (props: InitiativeCardProps) => {
	const { register, getFieldState, teamIndex, readonlyFields = [] } = props;
	const isNameReadonly = readonlyFields.includes('name');

	return (
		<Card
			className={cn(
				'relative overflow-hidden border-l-4 pt-0 shadow-md',
				props.borderClassName
			)}
		>
			<div
				className={cn(
					'pointer-events-none absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-br-3xl text-white [&_svg]:h-5 [&_svg]:w-5',
					props.markerClassName
				)}
			>
				{props.sideFlag}
			</div>
			<CardHeader className="border-b bg-muted/50 py-4 pl-16 pr-6">
				<CardTitle className="text-lg font-semibold tracking-tight text-muted-foreground">
					{props.sideTitle}
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-3 px-4 py-4 sm:px-5">
				{props.participants.map((participant, index) => {
					const nameFieldState = getFieldState(
						`teams.${teamIndex}.characters.${index}.name`
					);

					return (
						<div
							key={participant.uuid}
							className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/70 p-3"
						>
						{isNameReadonly ? (
							<span className="h-8 min-w-40 flex-1 content-center truncate text-sm font-medium sm:max-w-48">
								{participant.name}
							</span>
						) : (
							<Input
								type="text"
								placeholder="Character Name"
								className={cn(
									'h-8 w-full min-w-40 flex-1 sm:max-w-48',
									nameFieldState.invalid && 'border-destructive bg-destructive/10'
								)}
								aria-invalid={nameFieldState.invalid || undefined}
								{...register(`teams.${teamIndex}.characters.${index}.name`)}
							/>
						)}
							<span className="min-w-fit text-sm font-medium text-muted-foreground">
								{`(${formatAdjustedLevel(
									adjustedLevel(
										participant.level,
										participant.adjustment,
										participant.adjustmentLevelModifier
									)
								)})`}
							</span>
							<div className="flex flex-wrap items-center gap-3">
								<div className="flex items-center gap-1.5">
									<Activity className="h-4 w-4 text-muted-foreground" />
									<NumberInput
										name={`teams.${teamIndex}.characters.${index}.initiative`}
										{...{ register, getFieldState }}
									/>
								</div>
								<div className="flex items-center gap-1.5">
									<Heart className="h-4 w-4 text-muted-foreground" />
									<NumberInput
										name={`teams.${teamIndex}.characters.${index}.health`}
										{...{ register, getFieldState }}
									/>
									<span className="text-muted-foreground">/</span>
									<NumberInput
										name={`teams.${teamIndex}.characters.${index}.maxHealth`}
										{...{ register, getFieldState }}
									/>
								</div>
								<div className="flex items-center gap-1.5">
									<ShieldPlus className="h-4 w-4 text-muted-foreground" />
									<NumberInput
										name={`teams.${teamIndex}.characters.${index}.tempHealth`}
										{...{ register, getFieldState }}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
};
