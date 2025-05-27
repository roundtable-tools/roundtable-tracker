import { describe, it, expect } from 'vitest';
import { UuidElement } from './UuidElement.class';
import { UUID } from '@/utils/uuid';

// Create a concrete subclass for testing
class TestElement extends UuidElement {
    public foo?: string;
    constructor(props: { id?: UUID; foo?: string }) {
        super(props);
        this.foo = props.foo;
    }
}

describe('UuidElement', () => {
    it('should generate a UUID if none is provided', () => {
        const element = new TestElement({});
        expect(element.id).toBeDefined();
        expect(typeof element.id).toBe('string');
        expect(element.id.length).toBeGreaterThan(0);
    });

    it('should use the provided UUID', () => {
        const customId: UUID = '123e4567-e89b-12d3-a456-426614174000';
        const element = new TestElement({ id: customId });
        expect(element.id).toBe(customId);
    });

    it('should assign additional properties', () => {
        const element = new TestElement({ foo: 'bar' });
        expect(element.foo).toBe('bar');
    });
});