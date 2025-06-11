import { InitiativeElement } from './initiativeTypes';

type ExtractFromUnionByType<T, U> = T extends { type: U } ? T : never;

export interface InitiativeQueueListProps {
	queue: InitiativeElement[];
	mapTypeToElement: {
		[K in InitiativeElement['type']]: (
			item: ExtractFromUnionByType<InitiativeElement, K>,
			isFirstClass?: string
		) => JSX.Element;
	};
}

export function InitiativeQueueList({
	queue,
	mapTypeToElement,
}: InitiativeQueueListProps) {
	return (
		<ul className="flex flex-col gap-2">
			{queue.map((item, index) => {
				const isFirstClass = index === 0 ? '' : 'ring-transparent';

				const fn = mapTypeToElement[item.type] as (
					item: InitiativeElement,
					isFirstClass?: string
				) => JSX.Element;

				return fn(item, isFirstClass);
			})}
		</ul>
	);
}
