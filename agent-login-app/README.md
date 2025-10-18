# Agent Login App

## Overview
The Agent Login App is a Node.js application that provides a login interface for agents. It includes authentication functionality and an agent toolbar for managing agent status.

## Features
- Login page with fields for username, agent ID, and password.
- Temporary cache API for authentication.
- Login and logout functionality.
- Agent toolbar page with a logout button and status dropdown.
- Ability to change agent status.

## Project Structure
```
agent-login-app
├── src
│   ├── api
│   │   ├── auth.ts
│   │   └── status.ts
│   ├── cache
│   │   └── store.ts
│   ├── routes
│   │   ├── auth.ts
│   │   └── toolbar.ts
│   ├── views
│   │   ├── login.html
│   │   └── toolbar.html
│   ├── public
│   │   ├── css
│   │   │   └── styles.css
│   │   └── js
│   │       ├── auth.js
│   │       └── toolbar.js
│   ├── types
│   │   └── index.ts
│   └── app.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd agent-login-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to access the login page.

## License
This project is licensed under the MIT License.