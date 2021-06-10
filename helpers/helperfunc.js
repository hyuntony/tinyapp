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

module.exports = { lookUp };