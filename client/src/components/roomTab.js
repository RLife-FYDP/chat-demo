
const RoomTab = ({socket, room}) => {
  const joinRoom = () => {
    socket.emit('join_room', uuid)
  }

  const {uuid, name, users} = room

  return (
    <div className='cursor-pointer' onClick={joinRoom}>
      <p className='font-sans text-base'>
        {name}
      </p>
      <p className='font-sans text-sm'>
        {users.reduce((accum, username) => accum + username + ', ', '').slice(0, -2)}
      </p>
    </div>
  );
}

export default RoomTab;
