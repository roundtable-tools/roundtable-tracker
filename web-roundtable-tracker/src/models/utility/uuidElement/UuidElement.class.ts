import { generateUUID, UUID } from "@/utils/uuid";

export interface UuidElementProps {
    id?: UUID;
}

export abstract class UuidElement {
    public id: UUID;

    constructor({id}: UuidElementProps) {
        this.id = id ?? generateUUID();
    }
}