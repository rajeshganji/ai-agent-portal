function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>🎨 IVR Designer Test Page</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>React Router is working! ✅</p>
        <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.8)' }}>
          This means the frontend is loading and React Router is functioning correctly.
        </p>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '15px',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '0.9rem' }}>URL: {window.location.href}</p>
          <p style={{ fontSize: '0.9rem' }}>Time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default TestPage;