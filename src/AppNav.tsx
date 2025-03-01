import { Header } from 'grommet';
import { ReactNode } from 'react';

export const AppNav = (props: { children: ReactNode }) => (
	<Header
		background="brand"
		pad={{ left: 'medium', right: 'small', vertical: 'small' }}
		elevation="medium"
		children={props.children}
		sticky={'scrollup'}
		flex={{ shrink: 0 }}
	/>
);
