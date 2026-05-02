import { UUID } from '@/utils/uuid';
import { Command, CommandDeps } from '@/CommandHistory/common';
import { CompositeCommand } from '../CompositeCommand';
import { Character } from '@/store/data';
import { UpdateCharacterDataCommand } from '../UpdateCharacterDataCommand';
import { EndTurnCommand } from '../EndTurnCommand';
import { ReorderCharactersCommand } from '../ReorderCharactersCommand';
import { getFailureCommand } from './FailureCommad';

export const canBeDelayed = (
	character: Character,
	charactersWithTurn: Set<UUID>
) => {
	return charactersWithTurn.has(character.uuid);
};

const getKnockOutCommand = (
	characterId: string,
	deps: { charactersWithTurn: Set<UUID>; charactersOrder: UUID[] },
	commandDeps?: CommandDeps
) => {
	const { charactersWithTurn, charactersOrder } = deps;

	const moveToEnd = (value: UUID) => {
		return charactersOrder.filter((id) => id !== value).concat(value);
	};

	const hasTurn = charactersWithTurn.has(characterId);

	if (hasTurn) {
		return new EndTurnCommand({ uuid: characterId }, commandDeps);
	} else {
		return new ReorderCharactersCommand(
			{ newOrder: moveToEnd(characterId) },
			commandDeps
		);
	}
};

export const getChangeCharacterState = (
	character: Character,
	newState: Character['turnState'],
	deps: {
		charactersWithTurn: Set<UUID>;
		charactersOrder: UUID[];
		delayedOrder: UUID[];
	},
	commandDeps?: CommandDeps
) => {
	const commands: Command[] = [
		new UpdateCharacterDataCommand(
			{
				uuid: character.uuid,
				newCharacterProps: { turnState: newState },
			},
			commandDeps
		),
	];
	const moveToEndInInitiative = new ReorderCharactersCommand(
		{
			newOrder: deps.charactersOrder
				.filter((id) => id !== character.uuid)
				.concat(character.uuid),
		},
		commandDeps
	);

	const removeFromDelayed = new ReorderCharactersCommand(
		{
			newOrder: deps.delayedOrder.filter((id) => id !== character.uuid),
			type: 'delay',
		},
		commandDeps
	);

	const addToDelayed = new ReorderCharactersCommand(
		{
			newOrder: deps.delayedOrder.includes(character.uuid)
				? deps.delayedOrder
				: deps.delayedOrder.concat(character.uuid),
			type: 'delay',
		},
		commandDeps
	);

	const additionalCommands: Partial<
		Record<
			Character['turnState'],
			Partial<Record<Character['turnState'], Command[]>>
		>
	> = {
		normal: {
			'knocked-out': [getKnockOutCommand(character.uuid, deps, commandDeps)],
			delayed: [
				new EndTurnCommand({ uuid: character.uuid }, commandDeps),
				addToDelayed,
			],
		},
		delayed: {
			normal: [
				removeFromDelayed,
				new ReorderCharactersCommand(
					{
						newOrder: [character.uuid].concat(deps.charactersOrder),
					},
					commandDeps
				),
			],
			'knocked-out': [
				removeFromDelayed,
				getKnockOutCommand(character.uuid, deps, commandDeps),
			],
		},
		'knocked-out': {
			delayed: [moveToEndInInitiative, addToDelayed],
		},
	};

	const additionalCommandsForState =
		additionalCommands[character.turnState]?.[newState];

	if (additionalCommandsForState) commands.push(...additionalCommandsForState);

	const errorMessage = validateCharacterStateChange(character, newState, deps);

	if (errorMessage) return getFailureCommand(errorMessage);
	else return new CompositeCommand({ commands });
};

const validateCharacterStateChange = (
	character: Character,
	newState: Character['turnState'],
	{ charactersWithTurn }: { charactersWithTurn: Set<UUID> }
) => {
	if (character.turnState === newState) {
		return 'Character is already in that state';
	} else if (
		newState === 'delayed' &&
		!canBeDelayed(character, charactersWithTurn)
	) {
		return 'Character cannot be delayed';
	}

	return null;
};
