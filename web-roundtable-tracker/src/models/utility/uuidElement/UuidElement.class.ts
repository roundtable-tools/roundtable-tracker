import { generateUUID, UUID } from "@/utils/uuid";
import { z } from "zod";

export interface UuidElementProps {
    id?: UUID;
}

export abstract class UuidElement {
    public id: UUID;

    constructor({id}: UuidElementProps) {
        this.id = id ?? generateUUID();
    }
    static Schema = z.object({
        id: z.string().uuid().optional(),
    })
}