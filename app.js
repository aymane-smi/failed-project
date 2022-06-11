const res = require("express/lib/response");

const express    = require("express"),
      app        = express(),
      fonctions  = require("./controllers"),
      bodyParser = require("body-parser"),
      middleware = require("./middleware"),
      cookie     = require("cookie-session"),
      flash      = require("connect-flash"),
      PORT       = process.env.PORT || 3000;


//configuration

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    if (req.session !== undefined ) {
      res.locals.authenticated = true;
      res.locals.name = req.session.name;
    }
    return next();
});
app.use(cookie({
    secret: 'test-tp',
  }));
app.use(flash());


//routes

//login
app.post("/login", async(req, res)=>{
    console.log(req.body.user, req.body.password);
    const user = await fonctions.login(req.body.user, req.body.password);
    console.log(user);
    if(user != -1){
        req.session.user = user;
        req.session.name = req.body.name;
        req.flash("auth", "connecter");
    }else{
        req.flash("auth", "mdp/nom invalide!");
    }
    res.redirect("/");
});

app.get("/login", (req, res)=>{
    const flash = "Bonjour!" || null;
    res.send(`login page!`);
});

//new_user

app.post("/new_user", async (req, res)=>{
    const user = await fonctions.new_user(req.body.user, req.body.password);
    if(user != -1){
        console.log(user);
        req.session.user = user;
        req.session.name = req.body.name;
        req.flash("auth", "signup!");
    }
    res.redirect("/");
});

app.get("/new_user", (req, res)=>{
    res.send("new_user page!");
});


//logout

app.get("/logout", (req, res)=>{
    res.session = null;
    req.flash("auth", "bye!");
    res.redirect("/");
});

//page d'acceuil

app.get("/", (req, res)=>{
    res.send("page d'acceuil "+req.flash("auth"));
});


//search

app.get('/search', (req, res) => {
    let result = model.search(req.query.query, req.query.page);
    res.send(result);
});


//read

app.get('/read/:id', (req, res) => {
    let result = fonctions.read(req.params.id);
    res.send(result);
});

//create

//ici c'et important d'utiliser le middleware(is_authenticated) pour empecher les user non connecter d'ajouter une recipe
app.get("/create", middleware.is_authenticated, (req, res)=>{
    res.send("create page!");
});


//fonction costumiser pour la création d'une requte complete d'une recette
function post_data_to_recipe(req) {
    return {
      title: req.body.title, 
      description: req.body.description,
      img: req.body.img,
      duration: req.body.duration,
      ingredients: req.body.ingredients.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({name: e.trim()})),
      stages: req.body.stages.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({description: e.trim()})),
    };
  }


app.post("/create", middleware.is_authenticated, (req, res)=>{
    let id = model.create(post_data_to_recipe(req));
    res.redirect(`/read/${id}`);
});

//update 

app.get("/update/:id", middleware.is_authenticated, (req, res)=>{
    let result = fonctions.read(req.params.id);
    res.send("update page!\n"+result);
});

app.post("/update/:id", middleware.is_authenticated, (req, res)=>{
    let result = fonctions.update(post_data_to_recipe(req), id);
    req.flash("auth", "recipe updated!");
    res.redirect(`/read/${req.params.id}`);
});

//delete


app.get('/delete/:id', middleware.is_authenticated, (req, res) => {
    let result = model.read(req.params.id);
    res.send(`delete page!\n delet item #${result.id}`);
});

app.post('/delete/:id', middleware.is_authenticated, (req, res) => {
    model.delete(req.params.id);
    req.flash("auth", "item deleted!");
    res.redirect("/");
});

app.listen(PORT, ()=>{
    console.log(`server started listening at port ${PORT}`);
});