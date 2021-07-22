from aiohttp import web

import uuid
import time
import asyncio

import socketio
# create a Socket.IO server
sio = socketio.AsyncServer(cors_allowed_origins=['*', 'http://localhost:3000'])

# wrap with ASGI application
app = web.Application()
sio.attach(app)

chat_rooms = {}

class Room:
  def __init__(self, room_uuid, name) -> None:
    self.uuid = room_uuid
    self.name = name
    self.users = []
    self.message_history = []
    self.lock = asyncio.Lock()

  def remove_user(self, username):
    if username in self.users:
      self.users.remove(username)

  def add_user(self, username):
    self.users.append(username)

  def add_message(self, message):
    self.message_history.append(message)

  def to_dict(self):
    return {
      'uuid': self.uuid,
      'name': self.name,
      'users': self.users,
      'message_history': [vars(message) for message in self.message_history]
    }

class Message:
  def __init__(self, author, ts, text) -> None:
    self.author = author
    self.timestamp = ts
    self.text = text

@sio.event
def connect(sid, environ):
  print('connect ', sid)

@sio.event
async def disconnect(sid):
  print('disconnect ', sid)
  async with sio.session(sid) as session:
    if 'room' in session:
      session['room'].remove_user(session['username'])
      if len(session['room'].users) == 0:
        del chat_rooms[session['room'].uuid]
        await sio.emit('update_rooms', [chat_rooms[room].to_dict() for room in chat_rooms])

@sio.event
async def register_user(sid, username):
  await sio.save_session(sid, {'username': username})

@sio.event
async def create_room(sid, room_name):
  async with sio.session(sid) as session:
      # leave old room
    if 'room' in session:
      session['room'].remove_user(session['username'])
      if len(session['room'].users) == 0:
        del chat_rooms[session['room'].uuid]
      sio.leave_room(sid, session['room'].uuid)
    room = Room(uuid.uuid4().urn, room_name)
    chat_rooms[room.uuid] = room
    session['room'] = room
    session['room'].add_user(session['username'])
    sio.enter_room(sid, session['room'].uuid)
    await sio.emit('update_rooms', [chat_rooms[room].to_dict() for room in chat_rooms])
    await sio.emit('join_room', session['room'].to_dict(), to=sid)

@sio.event
async def get_rooms(sid):
  await sio.emit('update_rooms', [chat_rooms[room].to_dict() for room in chat_rooms], to=sid)


@sio.event
async def join_room(sid, room_uuid):
  async with sio.session(sid) as session:
    # leave old room
    if 'room' in session:
      if session['room'].uuid == room_uuid:
        return
      session['room'].remove_user(session['username'])
      if len(session['room'].users) == 0:
        del chat_rooms[session['room'].uuid]
      sio.leave_room(sid, session['room'].uuid)
      del session['room']

    # join new room
    session['room'] = chat_rooms[room_uuid]
    session['room'].add_user(session['username'])
    sio.enter_room(sid, session['room'].uuid)
    await sio.emit('join_room', session['room'].to_dict(), to=sid)
    await sio.emit('update_rooms', [chat_rooms[room].to_dict() for room in chat_rooms])

@sio.event
async def leave_room(sid):
  async with sio.session(sid) as session:
    session['room'].remove_user(session['username'])
    if len(session['room'].users) == 0:
      del chat_rooms[session['room'].uuid]
      await sio.emit('update_rooms', [chat_rooms[room].to_dict() for room in chat_rooms])
    sio.leave_room(sid, session['room'].uuid)
    del session['room']

@sio.event
async def send_message(sid, text):
  async with sio.session(sid) as session:
    async with session['room'].lock:
      message = Message(session['username'], time.time_ns(), text)
      session['room'].add_message(message)
    await sio.emit('broadcast_message', {'author': message.author, 'timestamp': message.timestamp, 'text': message.text}, room=session['room'].uuid)

if __name__ == '__main__':
  web.run_app(app)