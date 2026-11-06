import { createFileRoute } from '@tanstack/react-router';
import { CharacterSheetPage } from '@/components/CharacterSheet/CharacterSheetPage';

export const Route = createFileRoute('/character_sheet')({
	component: RouteComponent,
});

function RouteComponent() {
	return <CharacterSheetPage />;
}
