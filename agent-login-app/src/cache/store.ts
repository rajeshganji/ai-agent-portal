// src/cache/store.ts

interface Agent {
    id: string;
    name: string;
    status: string;
}

class Cache {
    private store: Map<string, Agent> = new Map();

    set(agentId: string, agent: Agent): void {
        this.store.set(agentId, agent);
    }

    get(agentId: string): Agent | undefined {
        return this.store.get(agentId);
    }

    delete(agentId: string): void {
        this.store.delete(agentId);
    }

    clear(): void {
        this.store.clear();
    }
}

const cache = new Cache();

export default cache;