import { type ParticipantSideTheme } from '@/store/trackerMappers';

/** Tailwind classes for each side's colour, shared by the tracker and the player view. */
export function getSideAccent(sideTheme: ParticipantSideTheme) {
	switch (sideTheme) {
		case 'pc':
			return {
				badge: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40',
				inactiveCard:
					'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-sky-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-sky-400',
				name: 'text-sky-200',
				activeCard:
					'border-sky-300 bg-sky-600 text-sky-50 shadow-lg shadow-sky-950/30',
				delayedCard: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
			};

		case 'opponent':
			return {
				badge: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40',
				inactiveCard:
					'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-rose-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-rose-400',
				name: 'text-rose-200',
				activeCard:
					'border-rose-300 bg-rose-700 text-rose-50 shadow-lg shadow-rose-950/30',
				delayedCard: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
			};

		case 'other':
			return {
				badge: 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/40',
				inactiveCard:
					'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-violet-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-violet-400',
				name: 'text-violet-200',
				activeCard:
					'border-violet-300 bg-violet-700 text-violet-50 shadow-lg shadow-violet-950/30',
				delayedCard: 'border-violet-500/50 bg-violet-500/10 text-violet-200',
			};

		case 'ally':
		default:
			return {
				badge: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40',
				inactiveCard:
					'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-emerald-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-emerald-400',
				name: 'text-emerald-200',
				activeCard:
					'border-emerald-300 bg-emerald-600 text-emerald-50 shadow-lg shadow-emerald-950/30',
				delayedCard: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
			};
	}
}

const HAZARD_STRIPES: Record<ParticipantSideTheme, string> = {
	pc: 'bg-[repeating-linear-gradient(135deg,rgba(56,189,248,0.14)_0_6px,rgba(56,189,248,0)_6px_12px)]',
	opponent:
		'bg-[repeating-linear-gradient(135deg,rgba(251,113,133,0.14)_0_6px,rgba(251,113,133,0)_6px_12px)]',
	ally: 'bg-[repeating-linear-gradient(135deg,rgba(52,211,153,0.14)_0_6px,rgba(52,211,153,0)_6px_12px)]',
	other:
		'bg-[repeating-linear-gradient(135deg,rgba(167,139,250,0.14)_0_6px,rgba(167,139,250,0)_6px_12px)]',
};

/** Diagonal stripes in the side's colour that mark a hazard's card or row. */
export const getHazardStripe = (sideTheme: ParticipantSideTheme) =>
	HAZARD_STRIPES[sideTheme];
