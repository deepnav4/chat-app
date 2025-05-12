import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<{text: string, isSelf: boolean}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create WebSocket connection
  const connectWebSocket = (roomToJoin: string) => {
    try {
      // Use secure WebSocket in production, non-secure for local development
      const wsUrl = window.location.hostname === 'localhost' ? 
        'ws://localhost:8080' : 
        `wss://${window.location.hostname}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError('');
        
        // Join the room
        ws.send(JSON.stringify({
          type: 'join',
          payload: {
            roomId: roomToJoin
          }
        }));
      };

      ws.onmessage = (event) => {
        // Parse incoming message
        try {
          const message = event.data;
          setMessages(prev => [...prev, { text: message, isSelf: false }]);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setConnected(false);
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to chat server.');
      setConnected(false);
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewRoom = () => {
    // Generate a random room ID
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setCurrentRoom(newRoomId);
    setView('chat');
    connectWebSocket(newRoomId);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setCurrentRoom(roomId);
    setView('chat');
    connectWebSocket(roomId);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !connected) return;
    
    // Send message to server
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      payload: {
        message: inputMessage
      }
    }));

    // Add to local messages (as self message)
    setMessages(prev => [...prev, { text: inputMessage, isSelf: true }]);
    setInputMessage('');
  };

  const exitRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setMessages([]);
    setCurrentRoom('');
    setView('home');
  };

  if (view === 'home') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
        <div className="w-full max-w-md rounded-lg bg-black p-6 text-white">
          <h1 className="mb-8 text-center text-3xl font-bold">Real Time Chat</h1>
          
          <p className="mb-8 text-center text-sm text-gray-400">
            temporary room that expires after all users exit
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={createNewRoom}
              className="w-full rounded bg-primary p-2 font-medium text-white transition-colors hover:bg-primary/90"
            >
              Create New Room
            </button>
            
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black px-2 text-gray-400">Or</span>
              </div>
            </div>
            
            <div className="mt-6">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="mb-2 w-full rounded border border-gray-700 bg-black p-2 text-white"
              />
              <button
                onClick={joinRoom}
                className="w-full rounded bg-gray-800 p-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black">
      <div className="flex items-center justify-between bg-gray-900 p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Room: {currentRoom}</h2>
          {connected ? (
            <span className="text-xs text-green-400">● Connected</span>
          ) : (
            <span className="text-xs text-red-400">● Disconnected</span>
          )}
        </div>
        <button 
          onClick={exitRoom}
          className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
        >
          Exit
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900 p-2 text-center text-sm text-white">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
          >
            <span 
              className={`inline-block max-w-[80%] break-words rounded p-2 ${
                message.isSelf 
                  ? 'bg-primary text-white' 
                  : 'bg-white text-black'
              }`}
            >
              {message.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-gray-900 p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-l border-none bg-white p-2 text-black"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!connected}
          />
          <button
            onClick={sendMessage}
            className={`rounded-r p-2 text-white transition-colors ${
              connected 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-gray-600 cursor-not-allowed'
            }`}
            disabled={!connected}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
