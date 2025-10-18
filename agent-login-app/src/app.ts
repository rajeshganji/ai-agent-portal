Sure, here's the contents for the file: /agent-login-app/agent-login-app/src/app.ts

import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import authRoutes from './routes/auth';
import toolbarRoutes from './routes/toolbar';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static('src/public'));
app.set('view engine', 'html');

app.use('/api/auth', authRoutes);
app.use('/api/toolbar', toolbarRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});