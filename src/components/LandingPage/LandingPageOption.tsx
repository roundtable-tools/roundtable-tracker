import { Text, Box, Card, CardHeader } from "grommet";

type LandingPageOptionProps = {
    setView: (view: string) => void;
    area: string;
    title: string; 
    color: string; 
    disabled: boolean;
}
export const LandingPageOption = (props: LandingPageOptionProps) => {
    const { setView, area, title, color, disabled } = props;
    return (
        <Box
            gridArea={area}
            fill
            onClick={disabled ? undefined : () => setView(area)}
            style={disabled ? {opacity: 0.1, cursor: 'default', userSelect: 'none'} : { userSelect: 'none'}}
        >
            <Card fill pad="small" background={color} elevation="medium">
                <CardHeader pad="small" fill justify="center">
                    <Text size="xxlarge">{title}</Text>
                </CardHeader>
            </Card>
        </Box>
    );
}