import React from 'react';
import { InitiativeList } from './InitiativeList';
import { InitiativePreview } from './InitiativePreview';
import { useEncounterStore } from '@/store/store';
import { APP_MODE } from '@/store/data';
export const InitiativeContainer: React.FC = () => {
    const appMode = useEncounterStore((state) => state.appMode);

    return (
        <div>
            {appMode == APP_MODE.Empty ? <></> : appMode === APP_MODE.Initiative ? <InitiativeList /> : <InitiativePreview />}
        </div>
    );
};
