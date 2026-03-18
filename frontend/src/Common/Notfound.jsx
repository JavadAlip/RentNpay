export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>404 - Page Not Found</h1>
      <p>
        <button
          onClick={() => window.history.back()}
          style={{
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            color: 'blue',
            textDecoration: 'underline',
            fontSize: '16px',
          }}
        >
          ← Back
        </button>
      </p>
    </div>
  );
}
