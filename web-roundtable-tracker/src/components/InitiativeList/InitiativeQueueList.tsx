import { Reorder, useDragControls } from 'motion/react';
import { InitiativeElement } from './initiativeTypes';
import { MoveVertical } from 'lucide-react';

type ExtractFromUnionByType<T, U> = T extends { type: U } ? T : never;

export interface InitiativeQueueListProps {
	queue: InitiativeElement[];
	mapTypeToElement: {
		[K in InitiativeElement['type']]: (
			item: ExtractFromUnionByType<InitiativeElement, K>,
			isFirstClass?: string
		) => JSX.Element;
	};
	onReorder: (queue: InitiativeElement[]) => void;
}

export function InitiativeQueueList({
	queue,
	mapTypeToElement,
	onReorder,
}: InitiativeQueueListProps) {
	return (
		<Reorder.Group
			values={queue}
			onReorder={onReorder}
			as="ul"
			className="flex flex-col gap-2"
		>
			{queue.map((item, index) => {
				const isFirstClass = index === 0 ? '' : 'ring-transparent';

				const fn = mapTypeToElement[item.type] as (
					item: InitiativeElement,
					isFirstClass?: string
				) => JSX.Element;

				return (
					<QueueItem key={item.element.uuid} item={item}>
						{fn(item, isFirstClass)}
					</QueueItem>
				);
			})}
		</Reorder.Group>
	);
}

function QueueItem({
	item,
	children,
}: {
	item: InitiativeElement;
	children: React.ReactNode;
}) {
	const controls = useDragControls();

	return (
		<Reorder.Item
			value={item}
			dragListener={false}
			dragControls={controls}
			className="flex items-center gap-2"
		>
			<MoveVertical
				onPointerDown={(e) => controls.start(e)}
				className="cursor-move"
			/>
			{children}
		</Reorder.Item>
	);
}
