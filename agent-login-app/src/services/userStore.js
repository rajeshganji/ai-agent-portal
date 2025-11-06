const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Dummy user data
const users = [
  {
    id: "1",
    username: "agent1",
    agentId: "agent12",
    password: "100", // In production, this would be hashed
    name: "Test Agent 1",
    role: "agent",
    status: "AVAILABLE",
  },
  {
    id: "2",
    username: "agent2",
    agentId: "A456",
    password: "pass456",
    name: "Test Agent 2",
    role: "agent",
    status: "AVAILABLE",
  },
];

class UserStore {
    constructor() {
        // Initialize cache with users
        users.forEach(user => {
            cache.set(`user:${user.username}`, user);
        });
    }

    async findByCredentials(username, agentId, password) {
        console.log('[UserStore] Searching for user:', username);
        const user = cache.get(`user:${username}`);
        
        if (!user) {
            console.log('[UserStore] User not found');
            return null;
        }

        if (user.agentId === agentId && user.password === password) {
            console.log('[UserStore] User authenticated successfully');
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }

        console.log('[UserStore] Invalid credentials');
        return null;
    }

    async updateUserStatus(username, status) {
        const user = cache.get(`user:${username}`);
        if (user) {
            user.status = status;
            cache.set(`user:${username}`, user);
            return true;
        }
        return false;
    }

    async getUserStatus(username) {
        const user = cache.get(`user:${username}`);
        return user ? user.status : null;
    }
}

module.exports = new UserStore();