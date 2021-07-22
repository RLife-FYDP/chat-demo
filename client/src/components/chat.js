import { useEffect, useRef, useState } from "react";

const Chat = ({socket, username}) => {
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const messagesRef = useRef(messages)

  const messageInputRef = useRef()

  useEffect(() => {
    socket.on('join_room', roomInfo => {
      setActiveRoom(roomInfo)
      setMessages(roomInfo.message_history)
      messagesRef.current = roomInfo.message_history
    })

    socket.on('broadcast_message', message => {
      setMessages([...messagesRef.current, message])
      messagesRef.current = [...messagesRef.current, message]

    })
  }, [socket])


  const sendMessage = () => {
    const message = messageInputRef.current.value
    messageInputRef.current.value = ''
    messageInputRef.current.focus()
    socket.emit('send_message', message)
  }


  if (activeRoom === null) {
    return <div></div>
  }


  return (
    <div>
      <p className='font-sans text-lg'>
        {activeRoom.name}
      </p>
      {messages.map(({author, timestamp, text}, i) => <p key={i} className='font-sans text-baseline'>{author}: {text}</p>)}
      <div>
      <label class="block text-gray-700 text-sm font-bold" for="roomName">
        Message
      </label>
      <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="roomName" type="text" placeholder="My room" ref={messageInputRef} onKeyPress={e => e.code === 'Enter' && sendMessage()}/>
        <button class="btn btn-blue" onClick={sendMessage}>
          Send Message
        </button>
      </div>
    </div>
  );
}

export default Chat;
