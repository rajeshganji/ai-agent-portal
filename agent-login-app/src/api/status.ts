// src/api/status.ts

import { Request, Response } from 'express';
import { cache } from '../cache/store';

export const getStatus = (req: Request, res: Response) => {
    const agentId = req.session.agentId;
    const agentInfo = cache.get(agentId);
    
    if (agentInfo) {
        res.json({ status: agentInfo.status });
    } else {
        res.status(404).json({ message: 'Agent not found' });
    }
};

export const updateStatus = (req: Request, res: Response) => {
    const { status } = req.body;
    const agentId = req.session.agentId;
    const agentInfo = cache.get(agentId);
    
    if (agentInfo) {
        agentInfo.status = status;
        cache.set(agentId, agentInfo);
        res.json({ message: 'Status updated successfully', status });
    } else {
        res.status(404).json({ message: 'Agent not found' });
    }
};