const users = [];

module.exports = {
  insertUser: (userData) => {
    users.push(userData);
    return userData;
  },

  findUser: (email) => {
    return users.find((user) => user.email === email);
  },
};
