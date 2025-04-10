import { useRef, useEffect } from 'react';

export function useEffectOnce(fn: () => void) {
	const ref = useRef(false);

	useEffect(() => {
		if (!ref.current) {
			fn();
		}

		return () => {
			ref.current = true;
		};
	}, [fn]);
}
