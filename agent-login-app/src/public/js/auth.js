document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const agentId = document.getElementById('agentId').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, agentId, password })
        });

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('agentId', data.agentId);
            sessionStorage.setItem('agentName', data.agentName);
            sessionStorage.setItem('agentStatus', data.agentStatus);
            window.location.href = '/toolbar.html';
        } else {
            const error = await response.json();
            alert(error.message);
        }
    });
});