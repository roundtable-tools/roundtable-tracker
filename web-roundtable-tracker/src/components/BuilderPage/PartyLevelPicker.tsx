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
	const inputRef = useRef<HTMLInputElement>(null);
	const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
	const draggedRef = useRef(false);

	// Keep inputText in sync when value changes externally
	useEffect(() => {
		setInputText(String(safeValue));
	}, [safeValue]);

	// Compute thumb position as percentage
	const pct = ((safeValue - MIN) / (MAX - MIN)) * 100;
	const levels = Array.from({ length: MAX - MIN + 1 }, (_, index) => MIN + index);

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

	const selectInputText = () => {
		if (inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	};

	return (
		<div className="mx-3">
			<div className="relative pt-11">
				<div
					className="pointer-events-none absolute top-1/2 z-12 -translate-x-1/2 -translate-y-1/2"
					style={{ left: `${pct}%` }}
				>
					<input
						ref={inputRef}
						type="text"
						inputMode="numeric"
						name={name}
						value={inputText}
						onPointerDown={(e) => {
							pointerStartRef.current = { x: e.clientX, y: e.clientY };
							draggedRef.current = false;
						}}
						onPointerMove={(e) => {
							const start = pointerStartRef.current;
							if (!start || draggedRef.current) {
								return;
							}

							const dx = Math.abs(e.clientX - start.x);
							const dy = Math.abs(e.clientY - start.y);
							if (dx + dy > 6) {
								draggedRef.current = true;
								inputRef.current?.blur();
							}
						}}
						onPointerUp={() => {
							if (!draggedRef.current) {
								selectInputText();
							}
							pointerStartRef.current = null;
							draggedRef.current = false;
						}}
						onChange={(e) => setInputText(e.target.value)}
						onFocus={() => inputRef.current?.select()}
						onBlur={(e) => {
							commitText(e.target.value);
							onBlur?.();
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								commitText(inputText);
								inputRef.current?.blur();
							}

							if (e.key === 'Escape') {
								setInputText(String(safeValue));
								inputRef.current?.blur();
							}
						}}
						className="pointer-events-auto h-8 w-8 rounded-md border border-foreground/45 bg-card px-1 py-0 text-center text-sm font-bold text-foreground shadow-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
					/>
				</div>
				<div className="pointer-events-none absolute inset-x-1 top-1/3 z-11 -translate-y-1/2">
					{levels.map((level) => {
						const levelPct = ((level - MIN) / (MAX - MIN)) * 100;
						const isMajor = level % 5 === 0;

						return (
							<div
								key={level}
								className="absolute -translate-x-1/2"
								style={{ left: `${levelPct}%` }}
							>
								<div
									className={isMajor
										? 'h-3 w-1 rounded-full bg-foreground/45'
										: 'h-3 w-0.5 rounded-full bg-foreground/25'}
								/>
							</div>
						);
					})}
				</div>
				<Slider
					value={safeValue}
					min={MIN}
					max={MAX}
					onChange={(v) => {
						onChange(v);
						setInputText(String(v));
					}}
					className="absolute z-10 w-[calc(100%+var(--spacing)*4)] top-1/2 -translate-y-1/2 px-2 -mx-2"
				/>
			</div>
		</div>
	);
}
