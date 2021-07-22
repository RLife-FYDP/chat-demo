import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client'
import Sidebar from './components/sidebar';
import Chat from './components/chat';
import { useEffect, useRef, useState } from 'react';

const socket = io('http://localhost:8080')
function App() {
  const [username, setUsername] = useState(null)
  const usernameInputRef = useRef()

  const createAccount = () => {
    const username = usernameInputRef.current.value
    console.log(username)
    socket.emit('register_user', username)
    setUsername(username)
  }

  if (username === null) {
    return (
      <div>
        <label class="block text-gray-700 text-sm font-bold" for="roomName">
          Please enter a username
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="roomName" type="text" placeholder="My room" ref={usernameInputRef}/>
          <button class="btn btn-blue" onClick={createAccount}>
            Create account
          </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      <Sidebar socket={socket} />
      <div className='col-span-4'>
        <Chat socket={socket} username={username} />
      </div>
    </div>
  );
}

export default App;
