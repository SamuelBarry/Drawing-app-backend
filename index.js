const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const {
  addUser,
  removeUser,
  getUser,
  getAllUsers,
  getUsersinRoom,
} = require("./helpers/userHelper");
const { pickRandomWord } = require("./helpers/userWord");
const router = require("./routes/router");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);
io.setMaxListeners(30);

let mysteryWord = "zeiocujnezorznxcunrcxuwnuezxenrctrozwxtcure";
let drawer;

app.use(router);
app.use(cors);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room }); // Ca marche bien comme il faut
    if (error) return callback(error);

    socket.emit("message", {
      user: "admin",
      text: `Bienvenue dans le salon ${user.room}, ${user.name} !`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined` });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersinRoom(user.room),
    });
    if (getUsersinRoom(user.room).length >= 2) {
      io.to(user.room).emit("message", {
        user: "admin",
        text:
          "Vous êtes plus de 2 dans le salon. Vous pouvez désormais commencer une partie",
      });
    }
  });

  socket.on("sendMessage", (message, callback) => {
    let user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    if (
      message.trim().toLowerCase() === mysteryWord.trim().toLowerCase() &&
      user !== drawer
    ) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `Félicitations à ${user.name} qui a deviné le mot mystère !`,
      });
      io.to(user.room).emit("message", {
        user: "admin",
        text: `Vous pouvez désormais relancer une nouvelle partie.`,
      });
      io.to(user.room).emit("gameWon", { user, mysteryWord });
    }
  });

  socket.on(
    "canvasUpdate",
    ({
      prevX,
      currX,
      prevY,
      currY,
      flag,
      dot_flag,
      func,
      res,
      eX,
      eY,
      color,
    }) => {
      let user = getUser(socket.id);

      if (user === drawer) {
        io.to(user.room).emit("canvasChange", {
          prevX,
          currX,
          prevY,
          currY,
          flag,
          dot_flag,
          func,
          res,
          eX,
          eY,
          color,
        });
      }
    }
  );
  socket.on("newGame", ({ room, playername }) => {
    // ATTENTION A BIEN DESTRUCTURER L'OBJET !
    const all_players = getUsersinRoom(room);
    drawer = all_players[Math.floor(Math.random() * all_players.length)];
    mysteryWord = pickRandomWord();
    if (playername !== drawer.name) {
      // On fait une disjonction selon si la personne qui vient de cliquer est designée dessinateur ou non
      socket.broadcast.to(drawer.id).emit("message", {
        user: "admin",
        text: `C'est à vous de dessiner pour cette partie ! Vous devez faire deviner le mot ${mysteryWord}`,
      });
    } else {
      socket.emit("message", {
        user: "admin",
        text: `C'est à vous de dessiner pour cette partie ! Vous devez faire deviner le mot ${mysteryWord}`,
      });
    }
    io.to(room).emit("message", {
      user: "admin",
      text: `${drawer.name} va essayer de vous faire deviner le mot mystère ! Faites vos propositions dans le chat ! `,
    });
  });

  socket.on("disconnect", (reason) => {
    if (reason !== "ping timeout") {
      const user = removeUser(socket.id);

      if (user) {
        io.to(user.room).emit("message", {
          user: "admin",
          text: `${user.name} has left`,
        });
      }
    }
  });
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
