$(document).ready(function() {
    // Debug logging
    console.log('[Login] Page initialized at:', new Date().toISOString());
    console.log('[Login] API endpoint:', '/api/auth/login');

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        console.log('[Login] Form submission started');
        
        const formData = {
            username: $('#username').val().trim(),
            agentId: $('#agentId').val().trim(),
            password: $('#password').val().trim()
        };
        
        console.log('[Login] Submitting data:', {
            username: formData.username,
            agentId: formData.agentId,
            password: '***'
        });

        console.log('[Login] Attempting login with username:', formData.username);

        // Show loading state
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();
        submitButton.prop('disabled', true).text('Logging in...');

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    console.log('[Login] Authentication successful');
                    window.location.href = '/toolbar';
                } else {
                    console.error('[Login] Server returned error:', response.error);
                    alert(response.error || 'Login failed. Please try again.');
                    submitButton.prop('disabled', false).text(originalText);
                }
            },
            error: function(xhr, status, error) {
                console.error('[Login] Authentication failed:', error);
                console.error('[Login] Server response:', xhr.responseJSON);
                alert(xhr.responseJSON?.error || 'Login failed. Please try again.');
                submitButton.prop('disabled', false).text(originalText);
            }
        });
    });

    // Add error handling for jQuery
    $(document).ajaxError(function(event, jqxhr, settings, error) {
        console.error('[Login] Ajax Error:', error);
    });
});