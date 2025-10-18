// src/types/index.ts

export interface Agent {
    id: string;
    name: string;
    status: string;
}

export interface LoginResponse {
    agentId: string;
    agentName: string;
    agentStatus: string;
}

export interface StatusUpdate {
    agentId: string;
    newStatus: string;
}