const Sqlite = require("better-sqlite3"),
      bcrypt = require("bcryptjs");
      db     = new Sqlite("db.sqlite");


//read fonction
//@return {object}
//@param {number} id

exports.read = (id) => {
    //chercher depuis la table recipe où l'id = params.id
    let found = db.prepare("SELECT * FROM recipe WHERE id = ?").get(id);

    if(found !== undefined){

        found.ingredients = db.prepare('SELECT name FROM ingredient WHERE recipe = ? ORDER BY rank').all(id);

        found.stages = db.prepare('SELECT description FROM stage WHERE recipe = ? ORDER BY rank').all(id);

        return found;

    }else{

        return null;

    }
};

//ceate fonction
//@return {number}
//@param {object} recipe

exports.create = (recipe) => {

    //retourner le id de cette insertion
    let id = db.prepare('INSERT INTO recipe (title, img, description, duration) VALUES (@title, @img, @description, @duration)').run(recipe).lastInsertRowid;

    //Création des requetes d'insertions
    let insert1 = db.prepare('INSERT INTO ingredient VALUES (@recipe, @rank, @name)');
    let insert2 = db.prepare('INSERT INTO stage VALUES (@recipe, @rank, @description)');

    //utilisaton de batching
    let transaction = db.transaction((recipe) => {
        for (let j = 0; j < recipe.ingredients.length; j++) {
          insert1.run({recipe: id, rank: j, name: recipe.ingredients[j].name});
        }
        for (let j = 0; j < recipe.stages.length; j++) {
          insert2.run({recipe: id, rank: j, description: recipe.stages[j].description});
        }
      });
    
      transaction(recipe);
    return id;
};

//update fonction
//@param {number} id
//@param {object] recipe
//@return {boolean}
//cette fonction retourne true si le recipe existe dans la BD sinon il retourne false


exports.update = (recipe, id) => {
    let result = db.prepare('UPDATE recipe SET title = @title, img = @img, description = @description WHERE id = ?').run(recipe, id);
  if (result.changes == 1) {
    let insert1 = db.prepare('INSERT INTO ingredient VALUES (@recipe, @rank, @name)');
    let insert2 = db.prepare('INSERT INTO stage VALUES (@recipe, @rank, @description)');

    let transaction = db.transaction((recipe) => {
      db.prepare('DELETE FROM ingredient WHERE recipe = ?').run(id);
      for (let j = 0; j < recipe.ingredients.length; j++) {
        insert1.run({recipe: id, rank: j, name: recipe.ingredients[j].name});
      }
      db.prepare('DELETE FROM stage WHERE recipe = ?').run(id);
      for (let j = 0; j < recipe.stages.length; j++) {
        insert2.run({recipe: id, rank: j, description: recipe.stages[j].description});
      }
    });

    transaction(recipe);
    return true;
  }
  return false;
};

//delete fonction
//@param {number} id


exports.delete = function(id) {
    db.prepare('DELETE FROM recipe WHERE id = ?').run(id);
    db.prepare('DELETE FROM ingredient WHERE recipe = ?').run(id);
    db.prepare('DELETE FROM stage WHERE recipe = ?').run(id);
}

//search fonction
//@param {string} query
//@param {string} page


exports.search = (query, page) => {
    const num_per_page = 32;
    query = query || "";
    page = parseInt(page || 1);
  
    // on utiliser l'opérateur LIKE pour rechercher dans le titre 
    //['count(*)'] le nom de clé de l'objet num_found qu'a comme valeur un nombre
    let num_found = db.prepare('SELECT count(*) FROM recipe WHERE title LIKE ?').get('%' + query + '%')['count(*)'];
    let results = db.prepare('SELECT id as entry, title, img FROM recipe WHERE title LIKE ? ORDER BY id LIMIT ? OFFSET ?').all('%' + query + '%', num_per_page, (page - 1) * num_per_page);
  
    return({
      results: results,
      num_found: num_found, 
      query: query,
      next_page: page + 1,
      page: page,
      num_pages: parseInt(num_found / num_per_page) + 1,
    });
  };

//login fonction
//@param {string} user
//@param {string} password
//@return {number}

exports.login = async function(user, password) {
    let result = await db.prepare('SELECT * FROM user WHERE name = ?').get(user);
    const test = await bcrypt.compare(password, result.password);
    if(test)
        return result.id;
    return -1;
}


//new_user fonction
//@param {string} user
//@param {string} password
//@return {number}
//elle ajoute le nouveau user dans la fin du table user


exports.new_user = async function(user, password) {
    password = await bcrypt.hash(password, 12);
    let result = await db.prepare('INSERT INTO user (name, password) VALUES (?, ?)').run(user, password);
    return result.id;
  }

//new_user("test", "test");