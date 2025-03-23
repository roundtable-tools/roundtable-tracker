import { Text, Box, Card, CardHeader } from "grommet";
import { ReactNode } from "react";

type LandingPageOptionProps = {
    setView: (view: string) => void;
    area: string;
    title: ReactNode; 
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
                    {typeof title === 'string' ? <Text size="xxlarge">{title}</Text> : title}
                </CardHeader>
            </Card>
        </Box>
    );
}