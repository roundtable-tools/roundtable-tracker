import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);

declare global {
	interface Window {
		dbg: <T>(value: T) => T;
	}
}

window.dbg = function <T>(value: T): T {
	console.log(value);

	return value;
};
