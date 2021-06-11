const express = require('express');
const cookieSession = require('cookie-session');
const { lookUp, generateRandomString, urlsForUser } = require('./helpers/helperfunc');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const PORT = 8080;


app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');

//DATABASE OBJECTS

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

//REDIRECTS

//Root page redirects
app.get('/', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});

// /u/shorturl redirect to longurl
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("This Url does not exist");
  }
  return res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//GET render

//Main page /urls template
app.get('/urls', (req, res) => {
  let user;
  if (req.session.user_id) {
    const cookie = req.session.user_id;
    user = users[cookie].email;
  }
  const urlObj = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {urls: urlObj, user};
  res.render("urls_index", templateVars);
});

// /urls/new template
app.get('/urls/new', (req, res) => {
  let user;
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  if (req.session.user_id) {
    const cookie = req.session.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  return res.render('urls_new', templateVars);
});

//shortURL template
app.get('/urls/:shortURL', (req, res) => {
  let user;
  if (req.session.user_id) {
    const cookie = req.session.user_id;
    user = users[cookie].email;
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("This URL does not exist");
  }
  if (!user) {
    return res.send("You are not logged in");
  }
  const urlObj = urlsForUser(req.session.user_id, urlDatabase);
  if (!urlObj[req.params.shortURL]) {
    return res.send("This URL does not belong to you");
  }
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  return res.render("urls_show", templateVars);
});

//login template
app.get('/login', (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect('/urls');
  }
  const user = undefined;
  const templateVars = { user };
  return res.render('urls_login', templateVars);
});

//register template
app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect('/urls');
  }
  const user = undefined;
  const templateVars = { user };
  return res.render('urls_register', templateVars);
});

// POST REQUESTS

//creating new shortURLs
app.post('/urls', (req, res) => {
  const cookie = req.session;
  if (!cookie.user_id) {
    return res.send("You are not logged in");
  }
  const shortStr = generateRandomString();
  urlDatabase[shortStr] = { longURL: req.body.longURL, userID: cookie.user_id };
  return res.redirect(`/urls/${shortStr}`);
});

//delete url
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.user_id;
  const shortUrl = req.params.id;
  if (!userID) {
    return res.send('You are not logged in');
  }
  if (urlDatabase[shortUrl].userID !== userID) {
    return res.send('This Url does not belong to you');
  }
  delete urlDatabase[shortUrl];
  return res.redirect('/urls');
});

//update button
app.post('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortUrl = req.params.shortURL;
  if (!userID) {
    return res.send('You are not logged in');
  }
  if (urlDatabase[shortUrl].userID !== userID) {
    return res.send('This Url does not belong to you');
  }
  urlDatabase[shortUrl].longURL = req.body.longURL;
  return res.redirect('/urls');
});

//login button
app.post('/login', (req, res) => {
  const loginAttempt = req.body;
  const userId = lookUp("email", loginAttempt.email, users);
  if (!userId) {
    return res.status(403).send('Username/email does not exist');
  }
  const hashedPassword = users[userId].password;
  if (userId) {
    if (!bcrypt.compareSync(loginAttempt.password, hashedPassword)) {
      res.status(403).send('Wrong password');
    } else if (bcrypt.compareSync(loginAttempt.password, hashedPassword)) {
      req.session['user_id'] = userId;
      return res.redirect('/urls');
    }
  }
});

//logout button
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  return res.redirect('/urls');
});


//register button
app.post('/register', (req, res) => {
  const newUser = req.body;
  const randomId = generateRandomString();
  if (newUser.email === "" | newUser.password === "") {
    return res.status(400).send("Email or password is entered empty");
  }
  if (lookUp("email", newUser.email, users)) {
    return res.status(400).send("Email already exists");
  }
  users[randomId] = {
    id: randomId,
    email: newUser.email,
    password: bcrypt.hashSync(newUser.password, saltRounds)
  };
  req.session['user_id'] = randomId;
  return res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
