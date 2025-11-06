$(document).ready(function() {
    console.log('[Toolbar] Initializing call center toolbar...');

    // Global variables
    let timerInterval = null;
    let seconds = 0;

    // Get agentId from global variable or hidden input
    const agentId = window.AGENT_ID || $('#agentId').val();
    console.log('[Toolbar] AgentId:', agentId);

    if (!agentId) {
        console.error('[Toolbar] Error: No agentId found!');
        return;
    }

    // Status management
    function updateAgentStatus(newStatus) {
        const statusDisplay = $('.agent-status');
        console.log('[Toolbar] Updating status to:', newStatus);
        
        // Convert status to lowercase for consistency
        const status = newStatus.toLowerCase();
        
        // Map of status display texts
        const statusDisplayText = {
            'ready': 'Ready',
            'incoming': 'Incoming Call',
            'busy': 'On Call',
            'acw': 'After Call Work',
            'pause': 'Paused'
        };
        
        // Remove all status classes
        statusDisplay.removeClass('status-ready status-incoming status-busy status-acw status-pause status-incoming-blink');
        
        // Add new status class
        statusDisplay.addClass(`status-${status}`);
        
        // Update status text with proper capitalization
        statusDisplay.text(statusDisplayText[status] || status);

        // Special handling for incoming status
        if (status === 'incoming') {
            statusDisplay.addClass('status-incoming-blink');
        }

        // Update dropdown with lowercase value
        $('#statusSelect').val(status);

        // Update server with lowercase status
        $.ajax({
            url: '/api/auth/status',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: status }),
            success: function(response) {
                console.log('[Toolbar] Status updated on server');
            },
            error: function(xhr, status, error) {
                console.error('[Toolbar] Failed to update status:', error);
                showNotification('Failed to update status', 'danger');
            }
        });
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        const notification = $(`
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `);
        
        if ($('.toast-container').length === 0) {
            $('body').append('<div class="toast-container position-fixed bottom-0 end-0 p-3"></div>');
        }
        
        $('.toast-container').append(notification);
        const toast = new bootstrap.Toast(notification);
        toast.show();
        
        notification.on('hidden.bs.toast', function() {
            notification.remove();
        });
    }

    // Call timer functions
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        seconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        seconds = 0;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        $('.call-timer').text(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
    }

    // Handle incoming call notification
    function handleIncomingCall(data) {
        const { caller, agentStatusChange } = data;
        console.log('[Call] Processing incoming call:', data);

        // Update agent status with lowercase status
        updateAgentStatus(agentStatusChange || 'incoming');

        // Update call information
        $('#currentCallInfo').addClass('call-active');
        $('#customerName').text(caller.name || 'Unknown');
        $('#customerPhone').text(caller.phoneNo);
        $('#customerAccount').text(caller.callId);
        
        // Enable call control buttons
        $('.quick-actions button').prop('disabled', false);
        
        // Start call timer
        startTimer();
        
        // Show notification
        showNotification(`Incoming call from ${caller.name || caller.phoneNo}`, 'info');

        // Play notification sound if available
        const audio = new Audio('/audio/incoming-call.mp3');
        audio.play().catch(err => console.log('[Audio] Could not play notification sound'));
    }

    // Initialize WebSocket for agent connections
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/agent`;
    console.log(`[WebSocket] Connecting to ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        console.log('[WebSocket] Connected to server, sending registration...');
        ws.send(JSON.stringify({
            type: 'register',
            agentId: agentId
        }));
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data);

            switch (data.type) {
                case 'registration_success':
                    showNotification('Connected to call center', 'success');
                    break;
                case 'incoming_call':
                    handleIncomingCall(data.data);
                    break;
                case 'error':
                    showNotification(data.message, 'danger');
                    break;
            }
        } catch (error) {
            console.error('[WebSocket] Failed to process message:', error);
        }
    };

    ws.onclose = function() {
        console.log('[WebSocket] Connection closed');
        showNotification('Connection lost. Please refresh the page.', 'warning');
    };

    ws.onerror = function(error) {
        console.error('[WebSocket] Error:', error);
        showNotification('Connection error occurred', 'danger');
    };

    // Status select handler
    $('#statusSelect').on('change', function() {
        const newStatus = $(this).val();
        updateAgentStatus(newStatus);
    });

    // Quick action handlers
    $('.quick-actions button').on('click', function() {
        const action = $(this).text().trim();
        console.log('[Toolbar] Quick action clicked:', action);
        
        switch(action) {
            case 'Hold':
                $(this).toggleClass('btn-outline-primary btn-primary');
                showNotification('Call placed on hold', 'warning');
                break;
            case 'Transfer':
                showNotification('Transfer feature coming soon', 'info');
                break;
            case 'End Call':
                stopTimer();
                $('#currentCallInfo').removeClass('call-active');
                $('.quick-actions button').prop('disabled', true);
                updateAgentStatus('ready');
                showNotification('Call ended', 'success');
                break;
        }
    });

    // Handle logout
    $('#logoutBtn').on('click', function() {
        if (ws) {
            ws.close();
        }
        
        $.ajax({
            url: '/api/auth/logout',
            method: 'POST',
            success: function(response) {
                window.location.href = '/';
            },
            error: function(xhr, status, error) {
                console.error('[Toolbar] Logout failed:', error);
                showNotification('Logout failed. Please try again.', 'danger');
            }
        });
    });
});
