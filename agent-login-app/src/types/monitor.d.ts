import { WebSocket } from 'ws';

export interface AgentConnection {
    agentId: string;
    ws: WebSocket;
    status: string;
    lastConnected: Date;
}

export interface MonitorResponse {
    totalAgents: number;
    agents: Array<{
        agentId: string;
        status: string;
        lastConnected: string;
    }>;
    timestamp: string;
}