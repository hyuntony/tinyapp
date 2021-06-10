const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const PORT = 8080;


app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');

//Helper Functions

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
// (first param = "email" or "password") (second param = value of email or password)
const lookUp = function(type,email) {
  for (let key in users) {
    if (users[key][type] === email) {
      return key;
    }
  }
  return false;
};

// creates a new urls object that belonging to specific user
const urlsForUser = function(id) {
  const finalObj = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      finalObj[key] = {longURL: urlDatabase[key].longURL, userID: id};
    }
  }
  return finalObj;
};


const urlDatabase = {
  "b2xVn2": { longURL:"http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL:"http://www.google.com", userID: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", saltRounds)
  }
};
//Root page redirects
app.get('/', (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});

//Main page /urls template
app.get('/urls', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const urlObj = urlsForUser(req.cookies.user_id);
  const templateVars = {urls: urlObj, user};
  res.render("urls_index", templateVars);
});

// /urls/new template
app.get('/urls/new', (req, res) => {
  let user;
  if (!req.cookies.user_id) {
    return res.redirect('/login');
  }
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  return res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const urlObj = urlsForUser(req.cookies.user_id);
  if (!urlObj[req.params.shortURL]) {
    res.send("This URL does not belong to you");
  }
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL};
  return res.render("urls_show", templateVars);

});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//creating new shortURLs
app.post('/urls', (req, res) => {
  const cookie = req.cookies;
  console.log(req.body);
  const shortStr = generateRandomString();
  urlDatabase[shortStr] = { longURL: req.body.longURL, userID: cookie.user_id };
  console.log(urlDatabase);
  return res.redirect(`/urls/${shortStr}`);
});

app.get('/u/:shortURL', (req, res) => {
  return res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//delete url
app.post('/urls/:id/delete', (req, res) => {
  const urlObj = urlsForUser(req.cookies.user_id);
  if (urlObj[req.params.id]) {
    delete urlDatabase[req.params.id];
  }
  return res.redirect('/urls');
});

//edit button
app.post('/urls/:id', (req, res) => {
  return res.redirect(`/urls/${req.params.id}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const urlObj = urlsForUser(req.cookies.user_id);
  if (urlObj[req.params.shortURL]) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
  }
  return res.redirect('/urls');
});

//login button
app.post('/login', (req, res) => {
  const loginAttempt = req.body;
  const hashedPassword = users[lookUp("email", loginAttempt.email)].password;
  if (!lookUp("email", loginAttempt.email)) {
    res.sendStatus(403);
  }
  if (lookUp('email', loginAttempt.email)) {
    if (!bcrypt.compareSync(loginAttempt.password, hashedPassword)) {
      res.sendStatus(403);
    } else if (bcrypt.compareSync(loginAttempt.password, hashedPassword)) {
      res.cookie('user_id', lookUp('email', loginAttempt.email));
      return res.redirect('/urls');
    }
  }
});

//logout button
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/urls');
});

//register template
app.get('/register', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  console.log(users);
  return res.render('urls_register', templateVars);
});

//register button
app.post('/register', (req, res) => {
  const newUser = req.body;
  const randomId = generateRandomString();
  if (newUser.email === "" | newUser.password === "") {
    res.sendStatus(400);
  }
  if (lookUp("email", newUser.email)) {
    res.sendStatus(400);
  }
  users[randomId] = {
    id: randomId,
    email: newUser.email,
    password: bcrypt.hashSync(newUser.password, saltRounds)
  };
  res.cookie('user_id', randomId);
  return res.redirect('/urls');
});

//login template
app.get('/login', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  return res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
