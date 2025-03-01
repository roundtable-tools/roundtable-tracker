import React from 'react';
import { InitiativePreview } from './InitiativePreview';
import { APP_MODE } from '@/store/data';
import { InitiativeList } from '@/components/InitiativeList/InitiativeList';
import { useEncounterStore } from '@/store/instance';
import { RoundBar } from '@/components/InitiativeList/RoundBar';
export const InitiativeContainer: React.FC = () => {
    const appMode = useEncounterStore((state) => state.appMode);

    return (
        <div>
            {appMode == APP_MODE.Empty 
            ? <></> : appMode === APP_MODE.Initiative 
            ? <><RoundBar /><InitiativeList /></> 
            : <InitiativePreview />}
        </div>
    );
};
