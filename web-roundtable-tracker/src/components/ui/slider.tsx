import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
	className?: string;
}

export function Slider({
	value,
	min,
	max,
	step = 1,
	onChange,
	className,
}: SliderProps) {
	return (
		<input
			type="range"
			min={min}
			max={max}
			step={step}
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			className={cn(
				'w-full cursor-pointer accent-primary',
				className
			)}
		/>
	);
}
