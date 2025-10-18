Sure, here's the contents for the file `/agent-login-app/agent-login-app/src/routes/auth.ts`:

import { Router } from 'express';
import { login, logout } from '../api/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);

export default router;