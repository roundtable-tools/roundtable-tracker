import React from 'react';
import { APP_MODE } from '@/store/data';
import { InitiativeList } from '@/components/InitiativeList/InitiativeList';
import { useEncounterStore } from '@/store/instance';
import { RoundBar } from '@/components/InitiativeList/RoundBar';
import { PreviewDisplay } from '@/components/PreviewDisplay/PreviewDisplay';
export const AppView: React.FC = () => {
    const appMode = useEncounterStore((state) => state.appMode);

    return (
        <div>
            {appMode == APP_MODE.Empty 
            ? <></> : appMode === APP_MODE.Initiative 
            ? <><RoundBar /><InitiativeList /></> 
            : <PreviewDisplay />}
        </div>
    );
};
