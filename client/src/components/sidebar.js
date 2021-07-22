import { useEffect, useRef, useState } from "react";
import RoomTab from "./roomTab";

const Sidebar = ({socket, onCreateRoom = () => {}, onChangeRoom = () => {}}) => {
  const [rooms, setRooms] = useState([])
  const roomInputRef = useRef()

  useEffect(() => {
    console.log(socket)
    socket.emit('get_rooms')
  }, [])

  useEffect(() => {
    socket.on('update_rooms', resRooms => {
      console.log('update_rooms')
      console.log(resRooms)
      setRooms(resRooms)
    })
  }, [socket])

  const createRoom = () => {
    const roomName = roomInputRef.current.value
    socket.emit('create_room', roomName)
  }

  return (
    <div className='flex flex-col'>
      {rooms.map((room, i)=> <RoomTab socket={socket} room={room} key={i} onChangeRoom={onChangeRoom}/>)}
      <div>
      <label class="block text-gray-700 text-sm font-bold" for="roomName">
        Room name
      </label>
      <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="roomName" type="text" placeholder="My room" ref={roomInputRef}/>
        <button class="btn btn-blue" onClick={createRoom}>
          Create New Room
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
