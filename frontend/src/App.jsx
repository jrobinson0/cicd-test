import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Loading message from backend...');

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not reach the backend.'));
  }, []);

  return (
    <main>
      <h1>Hello World</h1>
      <p data-testid="backend-message">{message}</p>
    </main>
  );
}

export default App;
