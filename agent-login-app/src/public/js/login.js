$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const data = {
            username: $('#username').val(),
            agentId: $('#agentId').val(),
            password: $('#password').val()
        };

        $.ajax({
            url: '/login',
            method: 'POST',
            data: data,
            success: function(response) {
                if (response.success) {
                    window.location.href = '/toolbar';
                }
            },
            error: function() {
                alert('Login failed. Please try again.');
            }
        });
    });
});