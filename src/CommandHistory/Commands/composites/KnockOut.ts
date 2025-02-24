import { UUID } from '@/utils/uuid';
import { UpdateCharacterCommand } from '../UpdateCharacterCommand';
import { Command } from '@/CommandHistory/common';
import { EndTurnCommand } from '../EndTurnCommand';
import { ReorderCharactersCommand } from '../ReorderCharactersCommand';
import { CompositeCommand } from '../CompositeCommand';

export const getKnockOutCommand = (
	characterId: string,
	deps: { charactersWithTurn: Set<UUID>; charactersOrder: UUID[] }
) => {
	const { charactersWithTurn, charactersOrder } = deps;

	const moveToEnd = (value: UUID) => {
		return charactersOrder.filter((id) => id !== value).concat(value);
	};

	const commands: Command[] = [
		new UpdateCharacterCommand({
			uuid: characterId,
			newCharacterProps: { state: 'knocked-out' },
		}),
	];

	const hasTurn = charactersWithTurn.has(characterId);

	if (hasTurn) {
		commands.push(new EndTurnCommand({ uuid: characterId }));
	} else {
		commands.push(
			new ReorderCharactersCommand({ newOrder: moveToEnd(characterId) })
		);
	}

	return new CompositeCommand({ commands });
};
