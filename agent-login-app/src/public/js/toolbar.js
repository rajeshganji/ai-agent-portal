document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');
    const statusDropdown = document.getElementById('status-dropdown');
    const agentStatusDisplay = document.getElementById('agent-status');

    // Function to update agent status
    function updateStatus(newStatus) {
        fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                agentStatusDisplay.textContent = newStatus;
            } else {
                console.error('Failed to update status:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Event listener for status dropdown change
    statusDropdown.addEventListener('change', function() {
        const selectedStatus = statusDropdown.value;
        updateStatus(selectedStatus);
    });

    // Event listener for logout button
    logoutButton.addEventListener('click', function() {
        fetch('/api/auth/logout', {
            method: 'POST',
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/views/login.html';
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});