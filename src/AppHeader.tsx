import { Header, Box, Toolbar, Button, DropButton, TextInput } from 'grommet';
import { Filter, FormPrevious, Search } from 'grommet-icons/icons';
import { EdgeType } from 'grommet/utils';
import { ReactNode } from 'react';

type AppHeaderProps = {
	setView: (view: string) => void;
	children?: ReactNode;
};

export const AppHeader = (props: AppHeaderProps) => {
	const { setView, children } = props;
	return (
		<Header background="brand" justify="center" fill="horizontal" pad="small">
			<Box
				onClick={() => setView('landingPage')}
				style={{ cursor: 'pointer', position: 'absolute', left: 10 }}
				direction="row"
				align="center"
			>
				<FormPrevious />
				Exit
			</Box>
			<Toolbar background="brand">
				{children ? (
					children
				) : (
					<>
						<TextInput icon={<Search />} />
						<DropButton
							kind="toolbar"
							icon={<Filter />}
							dropContent={<Box pad="small">Filter options</Box>}
						/>
						<Button label="Create" primary />
					</>
				)}
			</Toolbar>
		</Header>
	);
};
