import { useState, useMemo, useRef } from 'react';
import { useSavedPartiesStore } from '@/store/savedPartiesInstance';
import { Party, PartyIcon, PartyMember, PARTY_ICONS } from '@/store/savedParties';
import { PartyCard } from './PartyCard';
import { PartyFormModal, PartyFormValues } from './PartyFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutList, Grid2x2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { generateUUID } from '@/utils/uuid';

type Layout = 'list' | 'grid' | 'big-grid';
type SortKey = 'name' | 'size' | 'level';

type ModalState =
	| { open: false }
	| { open: true; mode: 'create' }
	| { open: true; mode: 'edit' | 'copy'; party: Party };

export function PartyDirectory() {
	const parties = useSavedPartiesStore((s) => s.parties);
	const addParty = useSavedPartiesStore((s) => s.addParty);
	const updateParty = useSavedPartiesStore((s) => s.updateParty);
	const removeParty = useSavedPartiesStore((s) => s.removeParty);

	const [layout, setLayout] = useState<Layout>('list');
	const [sortKey, setSortKey] = useState<SortKey>('name');
	const [filter, setFilter] = useState('');
	const [modal, setModal] = useState<ModalState>({ open: false });
	const [importOpen, setImportOpen] = useState(false);
	const [importText, setImportText] = useState('');
	const [importError, setImportError] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = filter.toLowerCase();
		const result = q
			? parties.filter((p) => p.name.toLowerCase().includes(q))
			: [...parties];

		result.sort((a, b) => {
			if (sortKey === 'name') return a.name.localeCompare(b.name);

			if (sortKey === 'size') return a.members.length - b.members.length;

			if (sortKey === 'level') {
				const minA = a.members.length > 0 ? Math.min(...a.members.map((m) => m.level)) : 0;
				const minB = b.members.length > 0 ? Math.min(...b.members.map((m) => m.level)) : 0;

				if (minA !== minB) return minA - minB;

				const maxA = a.members.length > 0 ? Math.max(...a.members.map((m) => m.level)) : 0;
				const maxB = b.members.length > 0 ? Math.max(...b.members.map((m) => m.level)) : 0;

				return maxA - maxB;
			}

			return 0;
		});

		return result;
	}, [parties, filter, sortKey]);

	const handleSubmit = (id: string, values: PartyFormValues) => {
		const members: PartyMember[] = values.members.map((m) => ({
			uuid: m.uuid,
			name: m.name,
			level: m.level ?? 1,
			maxHealth: m.maxHealth,
			tiePriority: m.tiePriority,
			player: m.player || undefined,
			class: m.class || undefined,
			ancestry: m.ancestry || undefined,
			ac: m.ac,
		}));

		if (modal.open && modal.mode === 'edit' && 'party' in modal) {
			updateParty(modal.party.id, {
				name: values.name,
				icon: values.icon as PartyIcon,
				members,
			});
		} else {
			addParty({
				id,
				name: values.name,
				icon: values.icon as PartyIcon,
				members,
			});
		}
	};

	const handleDelete = (id: string) => {
		if (window.confirm('Delete this party?')) {
			removeParty(id);
		}
	};

	const handleExportJson = (party: Party) => {
		const exportData = {
			name: party.name,
			icon: party.icon,
			members: party.members,
		};
		navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
	};

	const handleImportJson = () => {
		setImportError(null);
		let parsed: unknown;
		try {
			parsed = JSON.parse(importText);
		} catch {
			setImportError('Invalid JSON. Please check your input.');
			return;
		}
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			typeof (parsed as Record<string, unknown>).name !== 'string' ||
			!Array.isArray((parsed as Record<string, unknown>).members)
		) {
			setImportError('JSON must have a "name" string and "members" array.');
			return;
		}
		const raw = parsed as Record<string, unknown>;
		const icon: PartyIcon = PARTY_ICONS.includes(raw.icon as PartyIcon)
			? (raw.icon as PartyIcon)
			: 'Users';
		const members: PartyMember[] = (raw.members as Record<string, unknown>[]).map((m) => ({
			uuid: typeof m.uuid === 'string' ? m.uuid : generateUUID(),
			name: typeof m.name === 'string' ? m.name : '',
			level: typeof m.level === 'number' ? m.level : 1,
			maxHealth: typeof m.maxHealth === 'number' ? m.maxHealth : undefined,
			tiePriority: typeof m.tiePriority === 'boolean' ? m.tiePriority : true,
			player: typeof m.player === 'string' ? m.player : undefined,
			class: typeof m.class === 'string' ? m.class : undefined,
			ancestry: typeof m.ancestry === 'string' ? m.ancestry : undefined,
			ac: typeof m.ac === 'number' ? m.ac : undefined,
		}));
		addParty({ id: generateUUID(), name: raw.name as string, icon, members });
		setImportText('');
		setImportOpen(false);
	};

	const gridClass =
		layout === 'list'
			? 'flex flex-col gap-3'
			: layout === 'grid'
				? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'
				: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
						Parties
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">Party Setup</h1>
				</div>
				<Button onClick={() => setModal({ open: true, mode: 'create' })}>
					New Party
				</Button>
				<Button variant="outline" onClick={() => { setImportError(null); setImportText(''); setImportOpen(true); }}>
					Import from JSON
				</Button>
			</div>

			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				<Input
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Search parties…"
					className="h-9 max-w-60"
				/>

				<Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
					<SelectTrigger className="h-9 w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="name">Sort: Name</SelectItem>
						<SelectItem value="size">Sort: Party Size</SelectItem>
						<SelectItem value="level">Sort: Level Range</SelectItem>
					</SelectContent>
				</Select>

				<div className="ml-auto flex items-center gap-1 rounded-lg border bg-background p-1">
					{([
						{ key: 'list', Icon: LayoutList, label: 'List' },
						{ key: 'grid', Icon: Grid2x2, label: 'Grid' },
						{ key: 'big-grid', Icon: LayoutGrid, label: 'Large Grid' },
					] as const).map(({ key, Icon, label }) => (
						<button
							key={key}
							type="button"
							title={label}
							onClick={() => setLayout(key)}
							className={cn(
								'flex h-7 w-7 items-center justify-center rounded',
								layout === key
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
						>
							<Icon className="h-4 w-4" />
						</button>
					))}
				</div>
			</div>

			{/* Cards */}
			{filtered.length > 0 ? (
				<div className={gridClass}>
					{filtered.map((party) => (
						<PartyCard
							key={party.id}
							party={party}
							layout={layout}
							onEdit={() => setModal({ open: true, mode: 'edit', party })}
							onCopy={() => setModal({ open: true, mode: 'copy', party })}
							onDelete={() => handleDelete(party.id)}
							onExportJson={() => handleExportJson(party)}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-16 text-center">
					<p className="text-lg font-semibold">No parties yet</p>
					<p className="text-sm text-muted-foreground">
						Create your first party to reuse it across encounters.
					</p>
					<Button onClick={() => setModal({ open: true, mode: 'create' })}>
						New Party
					</Button>
				</div>
			)}

			{/* Import JSON Dialog */}
		<Dialog open={importOpen} onOpenChange={(open) => { if (!open) setImportOpen(false); }}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Import Party from JSON</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<p className="text-sm text-muted-foreground">
							Paste a party JSON object exported from this app.
						</p>
						<textarea
							className="min-h-48 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							value={importText}
							onChange={(e) => setImportText(e.target.value)}
							placeholder='{"name": "My Party", "icon": "Users", "members": [...]}'
						/>
						{importError && (
							<p className="text-sm text-destructive">{importError}</p>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setImportOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleImportJson} disabled={!importText.trim()}>
							Import
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		{/* Modal */}
			<PartyFormModal
				open={modal.open}
				onOpenChange={(open) => {
					if (!open) setModal({ open: false });
				}}
				initialParty={modal.open && 'party' in modal ? modal.party : undefined}
				mode={modal.open ? modal.mode : 'create'}
				onSubmit={handleSubmit}
			/>
		</div>
	);
}
