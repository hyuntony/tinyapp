//generate random 6digit string
const generateRandomString = function() {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
};

// look up the key of user object through values of email or password
// first param = "email" or "password"|| second param = value of email or password
// third param = the database object
const lookUp = function(type, searchValue, database) {
  for (let key in database) {
    if (database[key][type] === searchValue) {
      return key;
    }
  }
};

// creates a new urls object that belonging to specific user
const urlsForUser = function(id, database) {
  const finalObj = {};
  for (let key in database) {
    if (database[key].userID === id) {
      finalObj[key] = {longURL: database[key].longURL, userID: id};
    }
  }
  return finalObj;
};

module.exports = { lookUp, generateRandomString, urlsForUser };