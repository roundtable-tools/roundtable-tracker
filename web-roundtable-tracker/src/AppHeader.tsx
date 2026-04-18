import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Filter, Plus, Search } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

type AppHeaderProps = {
	setView: (view: string) => void;
	children?: ReactNode;
};

export const AppHeader = (props: AppHeaderProps) => {
	const { setView, children } = props;
	const navigate = useNavigate();
	const toolbar = children ? (
		children
	) : (
		<>
			<div className="relative hidden sm:block">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
				<Input
					aria-label="Search"
					className="h-9 w-56 border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/70"
					placeholder="Search"
				/>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="secondary"
						className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
					>
						<Filter className="h-4 w-4" />
						Filter
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Filter options</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>All encounters</DropdownMenuItem>
					<DropdownMenuItem>Prepared only</DropdownMenuItem>
					<DropdownMenuItem>Recently edited</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button className="bg-white text-slate-900 hover:bg-white/90">
				<Plus className="h-4 w-4" />
				Create
			</Button>
		</>
	);

	return (
		<header className="border-b bg-slate-900 text-white shadow-sm">
			<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<Button
					variant="ghost"
					className="-ml-2 text-white hover:bg-white/10 hover:text-white"
					onClick={() => {
					setView('landingPage');
					navigate({ to: '/' });
				}}
				>
					<ArrowLeft className="h-4 w-4" />
					Exit
				</Button>
				<div className="flex flex-1 items-center justify-end gap-2">{toolbar}</div>
			</div>
		</header>
	);
};
