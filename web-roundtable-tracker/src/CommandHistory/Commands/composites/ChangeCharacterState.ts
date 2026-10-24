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

// Moves the character to the end of the initiative order. A character outside
// the order (a simple hazard) stays out of it, so there is nothing to run.
const getMoveToEndCommands = (
	characterId: UUID,
	charactersOrder: UUID[],
	commandDeps?: CommandDeps
): Command[] =>
	charactersOrder.includes(characterId)
		? [
				new ReorderCharactersCommand(
					{
						newOrder: charactersOrder
							.filter((id) => id !== characterId)
							.concat(characterId),
					},
					commandDeps
				),
			]
		: [];

const getKnockOutCommands = (
	characterId: UUID,
	deps: { charactersWithTurn: Set<UUID>; charactersOrder: UUID[] },
	commandDeps?: CommandDeps
): Command[] =>
	deps.charactersWithTurn.has(characterId)
		? [new EndTurnCommand({ uuid: characterId }, commandDeps)]
		: getMoveToEndCommands(characterId, deps.charactersOrder, commandDeps);

export const getChangeCharacterState = (
	character: Character,
	newState: Character['turnState'],
	deps: {
		charactersWithTurn: Set<UUID>;
		charactersOrder: UUID[];
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
	const additionalCommands: Partial<
		Record<
			Character['turnState'],
			Partial<Record<Character['turnState'], Command[]>>
		>
	> = {
		normal: {
			'knocked-out': getKnockOutCommands(character.uuid, deps, commandDeps),
			delayed: [new EndTurnCommand({ uuid: character.uuid }, commandDeps)],
		},
		delayed: {
			normal: [
				new ReorderCharactersCommand(
					{
						newOrder: [character.uuid].concat(
							deps.charactersOrder.filter((id) => id !== character.uuid)
						),
					},
					commandDeps
				),
			],
			'knocked-out': getKnockOutCommands(character.uuid, deps, commandDeps),
		},
		'knocked-out': {
			delayed: getMoveToEndCommands(
				character.uuid,
				deps.charactersOrder,
				commandDeps
			),
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
