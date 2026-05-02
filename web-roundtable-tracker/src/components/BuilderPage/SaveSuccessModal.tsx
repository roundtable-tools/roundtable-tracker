import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import type { ConcreteEncounter } from '@/store/data';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { useNavigate } from '@tanstack/react-router';
import { Clipboard, FolderOpen, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SaveSuccessModalProps {
	encounter: ConcreteEncounter | null;
	onClose: () => void;
}

export function SaveSuccessModal({
	encounter,
	onClose,
}: SaveSuccessModalProps) {
	const navigate = useNavigate();
	const setEncounterData = useEncounterStore((state) => state.setEncounterData);
	const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>(
		'idle'
	);

	useEffect(() => {
		setCopyState('idle');
	}, [encounter?.id]);

	const handleRunEncounter = () => {
		if (!encounter) return;
		setEncounterData(encounter);
		onClose();
		navigate({ to: '/preview' });
	};

	const handleToDirectory = () => {
		onClose();
		navigate({ to: '/encounters' });
	};

	const handleCopyJson = async () => {
		if (!encounter) return;

		try {
			await navigator.clipboard.writeText(JSON.stringify(encounter, null, 2));
			setCopyState('success');
		} catch {
			setCopyState('error');
		}
	};

	return (
		<Dialog
			open={encounter !== null}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Encounter Saved</DialogTitle>
					<DialogDescription>
						{encounter?.name ?? 'Encounter'} has been saved successfully.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex-row gap-2 justify-end">
					<Button variant="outline" onClick={handleCopyJson}>
						<Clipboard className="mr-2 h-4 w-4" />
						{copyState === 'success'
							? 'Copied!'
							: copyState === 'error'
								? 'Copy Failed'
								: 'Copy JSON'}
					</Button>
					<Button variant="secondary" onClick={handleToDirectory}>
						<FolderOpen className="mr-2 h-4 w-4" />
						Directory
					</Button>
					<Button onClick={handleRunEncounter}>
						<Play className="mr-2 h-4 w-4" />
						Run Encounter
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
