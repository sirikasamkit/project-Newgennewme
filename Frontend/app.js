import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMsg = { user: 'Me', message: input };
    setChatLog([...chatLog, userMsg]);
    setInput('');

    try {
      const res = await axios.post('http://localhost:5000/chat', { message: input });
      setChatLog([...chatLog, userMsg, { user: 'Gemini', message: res.data.text }]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <div className="chat-box">
        {chatLog.map((chat, i) => (
          <div key={i} className={`message ${chat.user}`}>
            <strong>{chat.user}:</strong> {chat.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="พิมพ์ข้อความ..." />
        <button type="submit">ส่ง</button>
      </form>
    </div>
  );
}
export default App;