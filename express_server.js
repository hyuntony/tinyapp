const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const generateRandomString = function() {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
};

const lookUp = function(type,email) {
  for (let key in users) {
    if (users[key][type] === email) {
      return key;
    }
  }
  return false;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get('/', (req, res) => {
  res.send("Hello");
});

app.get('/urls', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  console.log(users);
  const templateVars = {urls: urlDatabase, user};
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);

});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  const shortStr = generateRandomString();
  urlDatabase[shortStr] = req.body.longURL;
  res.redirect(`/urls/${shortStr}`);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

//delete url
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//edit button
app.post('/urls/:id', (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

//login page
app.post('/login', (req, res) => {
  const loginAttempt = req.body;
  if (!lookUp("email", loginAttempt.email)) {
    console.log("hello");
    res.sendStatus(403);
  }
  if (lookUp('email', loginAttempt.email)) {
    if (!lookUp("password", loginAttempt.password)) {
      res.sendStatus(403);
    } else if (lookUp('password', loginAttempt.password)) {
      res.cookie('user_id', lookUp('email', loginAttempt.email));
      res.redirect('/urls');
    }
  }
});

//logout button
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//register template
app.get('/register', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  res.render('urls_register', templateVars);
});

//register button
app.post('/register', (req, res) => {
  const randomId = generateRandomString();
  const newUser = req.body;
  if (newUser.email === "" | newUser.password === "") {
    res.sendStatus(400);
  }
  if (lookUp("email", newUser.email)) {
    res.sendStatus(400);
  }
  users[randomId] = {
    id: randomId,
    email: newUser.email,
    password: newUser.password
  };
  res.cookie('user_id', randomId);
  res.redirect('/urls');
});

//login template
app.get('/login', (req, res) => {
  let user;
  if (req.cookies.user_id) {
    const cookie = req.cookies.user_id;
    user = users[cookie].email;
  }
  const templateVars = {user};
  res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
