import { useState } from 'react'
import LoginForm from './components/LoginForm.jsx'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [apiMessage, setApiMessage] = useState('');

  const fetchApi = async () => {
    try {
      const res = await fetch('/api');
      const text = await res.text();
      setApiMessage(text);
    } catch {
      setApiMessage('Error connecting to server');
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card" style={{display: 'flex', gap: '2rem', alignItems: 'flex-start'}}>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={fetchApi} style={{marginLeft: '1rem'}}>
          Fetch Server Message
        </button>
        {apiMessage && (
          <p style={{marginTop: '1rem'}}>
            Server says: {apiMessage}
          </p>
        )}
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        <LoginForm />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App
