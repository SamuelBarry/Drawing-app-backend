const users = [];

const addUser = ({ id, name, room }) => {
  name = name.trim();
  room = room.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );
  if (existingUser) {
    return { error: "Username is already taken" };
  }

  const user = { id, name, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  for (let c = users.length, i = 0; i < c; i++) {
    if (users[i].id === id) return users[i];
  }
  return null;
};

const getAllUsers = () => users;

const getUsersinRoom = (room) => {
  let result = [];
  for (let c = users.length, i = 0; i < c; i++) {
    if (users[i].room === room) {
      result.push(users[i]);
    }
  }
  return result;
};

module.exports = { addUser, removeUser, getUser, getUsersinRoom, getAllUsers };
