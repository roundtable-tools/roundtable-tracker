import { createContext } from 'react';
import { ThemeProviderState } from './theme-provider';

const initialState: ThemeProviderState = {
	theme: 'system',
	setTheme: () => null,
};
export const ThemeProviderContext =
	createContext<ThemeProviderState>(initialState);
