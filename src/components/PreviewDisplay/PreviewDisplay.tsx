import { ALIGNMENT, Participant, PRIORITY } from '@/EncounterDirectory/Encounter';
import { Grid } from 'grommet';
import { generateUUID } from '@/utils/uuid';
import { PreviewCard } from './PreviewCard';
import { useEncounterStore } from '@/store/instance';

export const PreviewDisplay = () => {
	const encounterData = useEncounterStore((state) => state.encounterData);
    const partyLevel = useEncounterStore((state) => state.partyLevel);
	return encounterData ? (
        <Grid columns={['1fr', '1fr']} gap="small">
            {encounterData.participants
                .reduce(
                    (acc, participant) => {
                        let allies = acc.find(
                            (participants) => participants[0].side === participant.side
                        );
                        if (!allies) {
                            return [...acc, [participant]];
                        }
                        allies.push(participant);
                        return acc;
                    },
                    [] as Participant<0 | 1>[][]
                )
                .map((participants, index) => {
                    return (
                        <PreviewCard key={index} alignment={Object.entries(ALIGNMENT).find(
                            ([, value]) => value === participants[0].side
                        )?.[0] ?? "Unknown"} participants={
                            participants.flatMap(({level,...participant}) =>
                            Array.from({ length: participant.count ?? 1 }).map(
                                () => ({
                                    uuid: generateUUID(),
                                    tiePriority: PRIORITY.NPC,
                                    ...participant,
                                    level: Number.isInteger(level)
                                        ? level as number
                                        : partyLevel + Number.parseInt(level as string),
                                })
                            )
                        )} />
                    );
                })}
            <PreviewCard alignment="Players" participants={encounterData.partySize} />
        </Grid>
	) : (
		<></>
	);
};
