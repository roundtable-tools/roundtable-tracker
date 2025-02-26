import { InitiativeParticipant } from "@/EncounterDirectory/Encounter";
import { Card, CardHeader, Text } from "grommet";

type InitiativeCardProps = {
    alignment: string;
    participants: InitiativeParticipant[] | number;
}

export const InitiativeCard = (props: InitiativeCardProps) => {
    return (
        <Card fill>
            <CardHeader>
                <Text size="large">
                    {props.alignment}
                </Text>
            </CardHeader>
            {Array.isArray(props.participants) ? props.participants.map((participant) => {
                return (
                    <Text key={participant.uuid}>{participant.name}</Text>
                );
            }) : Array.from({ length: props.participants }).map((_, index) => {
                return <Text key={index}>Character {index + 1}</Text>;
            }
            )}
        </Card>
    );
}