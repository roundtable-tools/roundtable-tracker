import { Header, Box, Toolbar, Button, DropButton, TextInput } from "grommet";
import { Filter, FormPrevious, Search } from "grommet-icons/icons";

type AppHeaderProps = {
    view: string;
    setView: (view: string) => void;
}

export const AppHeader = (props:AppHeaderProps) => {
    return (
        <Header background="brand" pad="small" justify="center">
            <Box onClick={()=>props.setView('landingPage')} style={{cursor: 'pointer', position: 'absolute', left: 10}} direction="row" align="center">
                <FormPrevious/>
                Exit    
            </Box>
            <Toolbar>
                <TextInput icon={<Search />} />
                <DropButton kind="toolbar" icon={<Filter />} dropContent={<Box pad="small">Filter options</Box>} />
                <Button label="Create" primary />
            </Toolbar>
        </Header>
    );
}