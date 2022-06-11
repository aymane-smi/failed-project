const fs     = require("fs"),
      Sqlite = require("better-sqlite3"),
      db     = new Sqlite("../db.sqlite");

// data.json:[1,2,3]
// readFileSync: "[1,2,3]"
// json.parse: [1,2,3]
const data = JSON.parse(fs.readFileSync("../assets/data.json"));
let execute = () => {

    //initialisation

    //si la table recipe existe alors on doit le supprimé
    db.prepare('DROP TABLE IF EXISTS recipe').run();

    //si la table ingeredient existe alors on doit le supprimé
    db.prepare('DROP TABLE IF EXISTS ingredient').run();

    //si la table stage existe alors on doit le supprimé
    db.prepare('DROP TABLE IF EXISTS stage').run();

    //Création de la table recipe
    db.prepare('CREATE TABLE recipe (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, img TEXT, description TEXT, duration TEXT)').run();
    
    //Création de la table ingredient
    db.prepare('CREATE TABLE ingredient (recipe INT, rank INT, name TEXT)').run();
    
    //Création de la table stage
    db.prepare('CREATE TABLE stage (recipe INT, rank INT, description TEXT)').run();

    //Formulaire d'insertion pour la table recipe
    let insert1 = db.prepare('INSERT INTO recipe VALUES (@id, @title, @img, @description, @duration)');

    //Formulaire d'insertion pour la table ingredient
    let insert2 = db.prepare('INSERT INTO ingredient VALUES (@recipe, @rank, @name)');

    //Formulaire d'insertion pour la table stage
    let insert3 = db.prepare('INSERT INTO stage VALUES (@recipe, @rank, @description)');

    //Cette méthode permet de execute un batch(ensemble de requetes) on donnant une array

    const execute_tx = db.transaction((data_) => {

        for (let id = 0;id < data_.length; id++) {
          //i=0
          //variable tmp
          //iteration 1
          let recipe = data_[id];
          recipe.id = id;
          insert1.run(recipe);
          for (let j = 0; j < recipe.ingredients.length; j++) {
            //iteration2
            insert2.run({recipe: id, rank: j, name: recipe.ingredients[j].name});
          }
          for (let j = 0; j < recipe.stages.length; j++) {
            insert3.run({recipe: id, rank: j, description: recipe.stages[j].description});
          }
        }
      });
    
    execute_tx(data);
};

execute();

//supprimer la table user s'il existe
db.prepare('DROP TABLE IF EXISTS user').run();

//creation de la table user avec ces champs
db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();

//insertion d'un utilisateur dans la table user avec le nom:admin et le mdp:miam
db.prepare("INSERT INTO user (name, password) VALUES ('admin', 'miam')").run();