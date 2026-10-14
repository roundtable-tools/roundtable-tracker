import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

type AppHeaderProps = {
	children?: ReactNode;
};

export const AppHeader = (props: AppHeaderProps) => {
	const { children } = props;
	const navigate = useNavigate();

	return (
		<header className="border-b bg-slate-900 text-white shadow-sm">
			<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<Button
					variant="ghost"
					className="-ml-2 text-white hover:bg-white/10 hover:text-white"
					onClick={() => {
						navigate({ to: '/' });
					}}
				>
					<ArrowLeft className="h-4 w-4" />
					Exit
				</Button>
				{children ? (
					<div className="flex flex-1 items-center justify-end gap-2">
						{children}
					</div>
				) : null}
			</div>
		</header>
	);
};
