import { Header, Box, Toolbar, Button, DropButton, TextInput } from 'grommet';
import { Filter, FormPrevious, Search } from 'grommet-icons/icons';
import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

type AppHeaderProps = {
	setView: (view: string) => void;
	children?: ReactNode;
};

export const AppHeader = (props: AppHeaderProps) => {
	const { setView, children } = props;
	const navigate = useNavigate();

	return (
		<Header background="brand" justify="center" fill="horizontal" pad="small">
			<Box
				onClick={() => {
					setView('landingPage');
					navigate({ to: '/' });
				}}
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
