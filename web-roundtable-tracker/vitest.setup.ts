import { afterEach } from 'vitest';

// Mock localStorage for test environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		key: (index: number) => {
			const keys = Object.keys(store);

			return keys[index] || null;
		},
		get length() {
			return Object.keys(store).length;
		},
	};
})();

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock,
	writable: true,
});

// Clear localStorage between tests
afterEach(() => {
	localStorage.clear();
});
