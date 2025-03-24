import {
	Box,
	Card,
	CardBody,
	CardHeader,
	ResponsiveContext,
	Text,
} from 'grommet';
import { Aed, Favorite, Run } from 'grommet-icons/icons';
import { ReactNode, useContext } from 'react';
import { Inputs } from './PreviewDisplay';
import { UseFormGetFieldState, UseFormRegister } from 'react-hook-form';
import { CharacterConfig } from '@/store/data';

type InitiativeCardProps = {
	accentColor: string;
	teamIndex: number;
	sideTitle: ReactNode;
	sideFlag: ReactNode;
	participants: CharacterConfig[];
	register: UseFormRegister<Inputs>;
	getFieldState: UseFormGetFieldState<Inputs>;
};

const InputBox = ({ children }: { children: ReactNode }) => (
	<Box
		cssGap
		flex
		gap={'small'}
		direction="row"
		style={{ flexShrink: 0, flexBasis: 'auto' }}
	>
		{children}
	</Box>
);

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
		<input
			type="number"
			min={0}
			step={1}
			style={{
				width: 50,
				backgroundColor: filed.invalid ? '#fde8e9' : '',
			}}
			{...register(name, {
				min: 0,
				valueAsNumber: true,
				validate: {
					isNumber: (value) => {
						if (isNaN(value)) {
							return 'Value must be a number';
						}

						return true;
					},
				},
			})}
		/>
	);
};

export const PreviewCard = (props: InitiativeCardProps) => {
	const size = useContext(ResponsiveContext);
	const { register, getFieldState, teamIndex } = props;

	return (
		<Box style={{ position: 'relative' }}>
			<Card
				fill
				elevation="medium"
				border={{ color: props.accentColor, size: 'large', side: 'left' }}
			>
				<CardHeader background={'light-5'} pad="small" justify="start">
					<Text size="xlarge" margin={{ left: 'xlarge' }}>
						{props.sideTitle}
					</Text>
				</CardHeader>
				<CardBody pad="small">
					{props.participants.map((participant, index) => {
						return (
							<Box
								key={participant.uuid}
								gap={'small'}
								direction="row"
								wrap
								cssGap
								pad={{ bottom: 'small' }}
							>
								<input
									type="text"
									style={{ width: 100, height: 'max-content' }}
									placeholder="Character Name"
									{...register(`teams.${teamIndex}.characters.${index}.name`)}
								/>
								<Text>{`(${participant.level})`}</Text>
								<Box
									cssGap
									flex
									gap={'small'}
									direction="row"
									wrap
									align="center"
									style={{ flexShrink: 0 }}
								>
									<InputBox>
										<Run />
										<NumberInput
											name={`teams.${teamIndex}.characters.${index}.initiative`}
											{...{ register, getFieldState }}
										/>
									</InputBox>
									<InputBox>
										<Favorite />
										<NumberInput
											name={`teams.${teamIndex}.characters.${index}.health`}
											{...{ register, getFieldState }}
										/>
										/
										<NumberInput
											name={`teams.${teamIndex}.characters.${index}.maxHealth`}
											{...{ register, getFieldState }}
										/>
									</InputBox>

									<InputBox>
										<Aed />
										<NumberInput
											name={`teams.${teamIndex}.characters.${index}.tempHealth`}
											{...{ register, getFieldState }}
										/>
									</InputBox>
								</Box>
							</Box>
						);
					})}
				</CardBody>
			</Card>
			<Box
				style={
					size === 'small'
						? { position: 'absolute', top: -9, left: -3, pointerEvents: 'none' }
						: { position: 'absolute', top: -8, left: 0, pointerEvents: 'none' }
				}
			>
				{props.sideFlag}
			</Box>
		</Box>
	);
};
