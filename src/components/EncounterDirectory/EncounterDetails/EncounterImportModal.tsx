import { Encounter } from '@/store/data';
import { Layer } from 'grommet';
import { useState } from 'react';
import { ImportCard } from './ImportCard'; // Import the ImportCard component
import { EncounterCard } from './EncounterCard'; // Import the EncounterCard component

type EncounterImportModalProps = {
    closeLayer: () => void;
    submit: (importedEncounter: Encounter) => void;
    showLayer: boolean;
};

export const EncounterImportModal = (props: EncounterImportModalProps) => {
    const { closeLayer, submit, showLayer } = props;
    const [importedEncounter, setImportedEncounter] = useState<Encounter | null>(null);

    return showLayer ? (
        <Layer
            background={{
                opacity: 0,
            }}
            onEsc={importedEncounter ? () => setImportedEncounter(null) : closeLayer}
            onClickOutside={closeLayer}
        >
            {!importedEncounter ? (
                <ImportCard
                    submit={(encounterData) => setImportedEncounter(encounterData)}
                    close={closeLayer}
                />
            ) : (
                <EncounterCard
                    selectedEncounter={importedEncounter}
                    submit={()=> {
                        submit(importedEncounter);
                    }}
                    close={() => setImportedEncounter(null)}
                />
            )}
        </Layer>
    ) : (
        <></>
    );
};
