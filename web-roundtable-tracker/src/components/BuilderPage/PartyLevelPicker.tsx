import { useRef, useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

interface PartyLevelPickerProps {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	onBlur?: () => void;
	name?: string;
	ref?: React.Ref<HTMLInputElement>;
}

export function PartyLevelPicker({
	value,
	onChange,
	onBlur,
	name,
	ref: _ref,
}: PartyLevelPickerProps) {
	const MIN = 1;
	const MAX = 20;
	const safeValue = typeof value === 'number' && Number.isFinite(value) ? Math.min(Math.max(value, MIN), MAX) : MIN;

	const [inputText, setInputText] = useState(String(safeValue));
	const sliderRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Keep inputText in sync when value changes externally
	useEffect(() => {
		setInputText(String(safeValue));
	}, [safeValue]);

	// Compute thumb position as percentage
	const pct = ((safeValue - MIN) / (MAX - MIN)) * 100;

	const commitText = (text: string) => {
		const num = parseInt(text, 10);
		if (!isNaN(num)) {
			const clamped = Math.min(Math.max(num, MIN), MAX);
			onChange(clamped);
			setInputText(String(clamped));
		} else {
			setInputText(String(safeValue));
		}
	};

	return (
		<div className="flex flex-col gap-1 px-3" ref={sliderRef}>
			{/* Floating label above thumb */}
			<div className="relative h-7 -mx-6 w-[calc(100%+1rem)]">
				<div
					className="absolute -translate-x-1/2 top-0"
					style={{ left: `calc(${pct}% * (1 - 1/${MAX - MIN + 1}) + 50% / ${MAX - MIN + 1} * 2)` }}
				>
					<input
						ref={inputRef}
						type="text"
						inputMode="numeric"
						name={name}
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						onBlur={(e) => {
							commitText(e.target.value);
							onBlur?.();
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								commitText(inputText);
								inputRef.current?.blur();
							}
						}}
						className="w-10 rounded border border-input bg-background px-1 py-0.5 text-center text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</div>
			<Slider
				value={safeValue}
				min={MIN}
				max={MAX}
				onChange={(v) => {
					onChange(v);
					setInputText(String(v));
				}}
                className='w-full'
			/>
		</div>
	);
}
