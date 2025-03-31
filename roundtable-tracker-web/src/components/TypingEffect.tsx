import { useInView, motion } from 'motion/react';
import { useRef } from 'react';

export function TypingEffect({ text = 'Typing Effect' }: { text: string }) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true });

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			{text.split('').map((letter, index) => (
				<motion.span
					key={`${text}-${index}`}
					initial={{ opacity: 0 }}
					animate={isInView ? { opacity: 1 } : {}}
					transition={{ duration: 0.1, delay: index * 0.05 }}
				>
					{letter}
				</motion.span>
			))}
		</div>
	);
}
