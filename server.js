const server = require("http").createServer();
const io = require("socket.io")(server, { path: "/" });

const activeUsers = {};

io.on("connection", socket => {
  socket.on("login", (name, cb) => {
    // Receive a name from the user.  If it's unique, add them to the activeUsers
    // object and broadcast the current list of users out to all connected
    // clients

    // If the name is taken, return false to the callback

    // Note: the user still has to select their character bofore they can
    // see chat.  They are set to active so users know they haven't joined yet
    if (!activeUsers.hasOwnProperty(name)) {
      activeUsers[name] = { socket, active: false };
      console.log(`${name} has connected`);
      const usersStatus = getUserlistObject();
      broadCastMessage("activeUsers", usersStatus);
      cb(name);
    } else {
      cb(false);
    }
  });

  socket.on("chat", messageOBJ => {
    // User sends a message, send message to all clients
    broadCastMessage("chat", messageOBJ);
  });

  socket.on("disconnect", name => {
    // User disconnects, currently not working
    console.log("User left: ", name);
    // Possible to feed a name?
    for (let user in activeUsers) {
      if (activeUsers[user] === socket) {
        delete activeUsers[user];
      }
      broadCastMessage("activeUsers", Object.keys(activeUsers));
    }
  });

  socket.on("userList", cb => {
    // Update list of current users
    cb(getUserlistObject());
  });

  socket.on("activeUsers", cb => {
    // Send a list of active users to the client
    socket.emit(cb(getUserlistObject()));
  });

  socket.on("status", (name, status) => {
    // Toggle the status of a user between active,inactive
    activeUsers[name].active = !activeUsers[name].active;
  });

  socket.on("events", eventData => {
    // Users send an invite/event to each other
    socket.broadcast.to(activeUsers[eventData.toUser].id).emit("events", {
      fromUser: eventData.fromUser,
      type: eventData.type
    });
  });

  socket.on("combat", combatData => {
    // Send combat data between users
    socket.broadcast
      .to(activeUsers[combatData.toUser].id)
      .emit("combat", combatData.message);
  });

  socket.on("error", err => {
    // Console log errors
    console.log("received error from client:", client.id);
    console.log(err);
  });

  const broadCastMessage = (room, message) => {
    // Public broadcast
    // Broad cast to everyone in a room
    for (let user in activeUsers) {
      activeUsers[user].emit(room, message);
    }
  };
}); // io.on connection

function getUserlistObject() {
  let userAndStatus = {};
  for (let user in activeUsers) {
    userAndStatus[user] = {
      name: user,
      active: activeUsers[user].active
    };
  }

  return userAndStatus;
}

const port = 28890;
server.listen(port);
server.on("listening", () => console.log("Listening on port", port));