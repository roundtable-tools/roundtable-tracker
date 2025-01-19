import { Header } from 'grommet';
import { ReactNode } from 'react';

export const AppBar = (props: { children: ReactNode }) => (
	<Header
		background="brand"
		pad={{ left: 'medium', right: 'small', vertical: 'small' }}
		elevation="medium"
		children={props.children}
	/>
);
