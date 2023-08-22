
/**
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 */

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const assert = require('assert');
const api_key = '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'; // remove this line before github

router.use(express.json()); // Parse JSON-encoded bodies
router.use(express.urlencoded({ extended: true }));
router.use(express.static("views"));

/**
 * @desc retrieves the current users
 */
router.get("/get-test-users", (req, res, next) => {

  //Use this pattern to retrieve data
  //NB. it's better NOT to use arrow functions for callbacks with this library
  global.db.all("SELECT * FROM testUsers", function (err, rows) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      res.json(rows);
    }
  });

});

/**
 * @desc retrieves the current user records
 */
router.get("/get-user-records", (req, res, next) => {
  //USE this pattern to retrieve data
  //NB. it's better NOT to use arrow functions for callbacks with this library

  global.db.all("SELECT * FROM testUserRecords", function (err, rows) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      res.json(rows);
    }
  });
});

/**
 * @desc Renders the page for creating a user record
 */
router.get("/create-user-record", (req, res) => {
  res.render("create-user-record");
});

/**
 * @desc Add a new user record to the database for user id = 1
 */
router.post("/create-user-record", (req, res, next) => {
  //USE this pattern to update and insert data
  //NB. it's better NOT to use arrow functions for callbacks with this library
  const data = generateRandomData(10);
  global.db.run(
    "INSERT INTO testUserRecords ('test_record_value', 'test_user_id') VALUES( ?, ? );",
    [data, 1],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.send(`New data inserted @ id ${this.lastID}!`);
        next();
      }
    }
  );
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", (req, res, next) => {
  //do a post query because it is more secure, will not leak sensitive data such as password
  console.log("reached login route");
  global.db.get(
    //check if username from form corresponds to existing name in the user table
    "SELECT * FROM user WHERE user.user_name = ?",
    [req.body.user_name],
    function (err, row) {
      if (err) {
        // Send the error to the error handler
        console.log(err);
        //if username does not exist
      } else if (!row) {
        //redirect user back to login page to prevent unauthorizes access
        res.render("login");
      } else {
        //compare the entered password with the hashed password stored in the database using bcrypt compare
        bcrypt.compare(req.body.user_password, row.user_password, (err, rows) => {
          if (err) {
            // Send the error to the error handler
            console.log(err);
            // if password match, 
          } else if (rows === true) {
            //set session storage user id to id of the retrieved user
            req.session.userid = row.user_id;
            res.redirect("/getAllNotes");
          } else {
            // Passwords do not match, login unsuccessful
            res.render("login");
          }
        });
      }
    }
  );
})

router.get("/register", (req, res) => {
  res.render("register");
});

//create new user 
router.post("/register", (req, res, next) => {
  //get password from form, encrypt using bcrypt
  console.log("reach register route");
  bcrypt.hash(req.body.password, 10, (err, pw) => {
    if (err) {
      // Send the error to the error handler
      console.log(err);
    } else {
      //do a post query, insert the name, email, hashed password, role into the db, user
      global.db.run(
        "INSERT INTO user ('user_name', 'user_email', 'user_password') VALUES( ?, ?, ?);",
        [req.body.name, req.body.email, pw],
        function (err) {
          if (err) {
            //send the error on to the error handler
            console.log(err);
          }
          else {
            //upon sucessful registration, direct user to login page 
            res.redirect("/login");
          }
        });
    }
  }
  );
});


router.get("/getAllNotes", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all("SELECT * FROM note WHERE note.user_id  = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all("SELECT * FROM user WHERE user.user_id  = ?",
          [userid],
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              global.db.all("SELECT * FROM folder WHERE folder.user_id  = ?",
                [userid],
                function (err, folder) {
                  if (err) {
                    next(err); //send the error on to the error handler
                  } else {
                    rows.sort((note1, note2) => {
                      const date1 = new Date(note1.note_mdatetime);
                      const date2 = new Date(note2.note_mdatetime);
                      return date2 - date1;
                    });
                    res.render("home", { notes: rows, users: row, folders: folder });
                    next();
                  }
                })
            }
          })
      }
    })
})


router.get("/getIndivNote", (req, res, next) => {
  //USE this pattern to retrieve data
  //NB. it's better NOT to use arrow functions for callbacks with this library
  const userid = req.session.userid;
  global.db.all("SELECT * FROM note WHERE note_id  = ?",
    [req.query.note_id],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all("SELECT * FROM folder",
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              global.db.all("SELECT * from user WHERE user_id  = ?",
                [userid],
                function (err, u) {
                  if (err) {
                    next(err); //send the error on to the error handler
                  } else {
                    res.render("notes", { notes: rows, folders: row, users: u, api_key: api_key });
                    next();
                  }
                })
            }
          })
      }
    });
});


router.post("/createNote", (req, res, next) => {
  const userid = req.session.userid;
  // const template = req.body.note_template ? req.body.note_template : "blank";

  global.db.run(
    "INSERT INTO note ('note_title', 'note_subtitle', 'note_content', 'note_template', 'note_font', 'note_fontsize', 'note_cdatetime', 'note_mdatetime', 'note_bookmarked', 'user_id', 'folder_id') VALUES( ?, ?, ?, ?, ?,?, datetime('now', 'localtime'), datetime('now', 'localtime'),  ?, ?, ?);",
    [req.body.note_title, req.body.note_subtitle, req.body.note_content, req.body.note_template, req.body.note_font, req.body.note_fontsize, 'no', userid, req.body.folder],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
      }
    }
  );
});

router.get("/updateNoteSettings", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all(
    "SELECT * FROM note WHERE note_id = ?;",
    [req.query.note_id],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all(
          "SELECT * FROM user WHERE user_id = ?;",
          [userid],
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              global.db.all(
                "SELECT * FROM folder WHERE user_id = ?;",
                [userid],
                function (err, folder) {
                  if (err) {
                    next(err); //send the error on to the error handler
                  } else {
                    res.render("editNotes", { notes: rows, users: row, folders: folder, api_key: api_key });
                    next();
                  }
                })
            }
          })
      }
    });
});

router.post("/updateNoteSettings", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run(
    "UPDATE note SET note_title = ?, note_subtitle = ?, note_mdatetime = datetime('now', 'localtime'), folder_id = ? WHERE note_id = ?;",
    [req.body.note_title, req.body.note_subitle, req.body.folder_id, req.body.note_id],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});

router.post("/updateNote", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run(
    "UPDATE note SET note_content = ?, note_template = ?, note_font = ?, note_fontsize = ?,  note_mdatetime = datetime('now', 'localtime') WHERE note_id = ?;",
    [req.body.note_content, req.body.note_template, req.body.note_font, req.body.note_fontsize, req.body.note_id],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});

router.post("/deleteNote", (req, res, next) => {
  global.db.run(
    "DELETE FROM note WHERE note_id = ?;",
    [req.body.note_id],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});

router.get("/notes", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all("SELECT * from folder WHERE user_id  = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all("SELECT * from user WHERE user_id  = ?",
          [userid],
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              global.db.all("SELECT * from note WHERE note.user_id  = ?",
                [userid],
                function (err, note) {
                  if (err) {
                    next(err); //send the error on to the error handler
                  } else {
                    res.render("createNotes", { folders: rows, users: row, notes: note, api_key: api_key });
                  }
                })
            }
          })
      }
    });
});


router.get("/userprofile", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all("SELECT * FROM user WHERE user_id  = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.render("userprofile", { users: rows });
        next();
      }
    });
})

router.post("/updateUser", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run("UPDATE user SET user_name = ?, user_email = ? WHERE user_id  = ?",
    [req.body.user_name, req.body.user_email, userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all("SELECT * FROM user WHERE user_id  = ?",
          [userid],
          function (err, rows) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              res.render("userprofile", { users: rows });
              next();
            }
          })
      }
    });
})

router.post("/deleteUser", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run("DELETE FROM user WHERE user_id = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("login");
      }
    });
})


router.post("/createFolder", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run(
    "INSERT INTO folder ('folder_name', 'user_id') VALUES( ?, ? );",
    [req.body.folder_name, userid],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});


router.get("/getNotesFromFolder", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all("SELECT * FROM note WHERE folder_id  = ?",
    [req.query.folder_id],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all("SELECT * FROM user WHERE user.user_id  = ?",
          [userid],
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              // res.render("home", {folders: rows, users: row});
              global.db.all("SELECT * FROM folder WHERE folder.user_id  = ?",
                [userid],
                function (err, folder) {
                  if (err) {
                    next(err); //send the error on to the error handler
                  } else {
                    rows.sort((note1, note2) => {
                      const date1 = new Date(note1.note_mdatetime);
                      const date2 = new Date(note2.note_mdatetime);
                      return date2 - date1;
                    });
                    res.render("home", { notes: rows, users: row, folders: folder });
                    next();
                  }
                })
            }
          })
      }
    });
})

router.post("/bookmarkNote", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run(
    "UPDATE note SET note_bookmarked = 'yes' WHERE note_id = ?;",
    [req.body.note_id],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});

router.post("/unbookmarkNote", (req, res, next) => {
  const userid = req.session.userid;
  global.db.run(
    "UPDATE note SET note_bookmarked = 'no' WHERE note_id = ?;",
    [req.body.note_id],
    function (err) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.redirect("/getAllNotes");
        next();
      }
    }
  );
});

router.get("/bookmarkNote", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all(
    "SELECT * FROM note WHERE note_bookmarked = 'yes' and user_id = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        global.db.all(
          "SELECT * FROM user WHERE user_id = ?;",
          [userid],
          function (err, row) {
            if (err) {
              next(err); //send the error on to the error handler
            } else {
              res.render("bookmarks", { notes: rows, users: row });
              next();
            }
          }
        )
      }
    }
  );
});

router.get("/search", (req, res, next) => {
  const userid = req.session.userid;
  console.log("Reached search route handler");
  const search = `%${req.query.note_title}%`;

  global.db.all(
    "SELECT note.* ,user.user_name FROM note JOIN user ON note.user_id = user.user_id WHERE note_title like ? AND note.user_id = ?",
    [search, userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        if (Array.isArray(rows) && rows.length > 0) {
          // Found article
          const noteId = rows[0].note_id;
          global.db.all(
            "SELECT * FROM user WHERE user.user_id = ?",
            [userid],
            function (err, row) {
              if (err) {
                next(err); //send the error on to the error handler
              } else {
                global.db.all("SELECT * FROM folder WHERE folder.user_id  = ?",
                  [userid],
                  function (err, folder) {
                    if (err) {
                      next(err); //send the error on to the error handler
                    } else {
                      rows.sort((note1, note2) => {
                        const date1 = new Date(note1.note_mdatetime);
                        const date2 = new Date(note2.note_mdatetime);
                        return date2 - date1;
                      });
                      res.render("home", { notes: rows, users: row, folders: folder });
                      next();
                    }
                  })
              }
            }
          );
        }
        else {
          // No articles found, redirect to all reader home page
          res.redirect("/getAllNotes");
        }
      }
    }
  );
});


router.get("/searchBookmark", (req, res, next) => {
  const userid = req.session.userid;
  console.log("Reached search route handler");
  const search = `%${req.query.note_title}%`;

  global.db.all(
    "SELECT note.* ,user.user_name FROM note JOIN user ON note.user_id = user.user_id WHERE note_title like ? AND note.user_id = ? AND note.note_bookmarked = 'yes'",
    [search, userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        if (Array.isArray(rows) && rows.length > 0) {
          // Found article
          const noteId = rows[0].note_id;
          global.db.all(
            "SELECT * FROM user WHERE user.user_id = ?",
            [userid],
            function (err, row) {
              if (err) {
                next(err); //send the error on to the error handler
              } else {
                global.db.all("SELECT * FROM folder WHERE folder.user_id  = ?",
                  [userid],
                  function (err, folder) {
                    if (err) {
                      next(err); //send the error on to the error handler
                    } else {
                      rows.sort((note1, note2) => {
                        const date1 = new Date(note1.note_mdatetime);
                        const date2 = new Date(note2.note_mdatetime);
                        return date2 - date1;
                      });
                      res.render("bookmarks", { notes: rows, users: row, folders: folder });
                      next();
                    }
                  })
              }
            }
          );
        }
        else {
          // No articles found, redirect to all reader home page
          res.redirect("/bookmarkNote");
        }
      }
    }
  );
});

router.get("/summary", (req, res, next) => {
  const userid = req.session.userid;
  const noteContent = req.query.noteContent;

  global.db.all("SELECT * FROM user WHERE user_id  = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.render("summary", { users: rows, noteContent, api_key: api_key });
        next();
      }
    });
})

router.get("/rv", (req, res, next) => {
  const userid = req.session.userid;
  global.db.all("SELECT * FROM user WHERE user_id  = ?",
    [userid],
    function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.render("rv", { users: rows, api_key: api_key });
        next();
      }
    });
})


router.get("/logout", (req, res) => {
  //destroy session storage
  req.session.destroy((err) => {
    if (err) {
      // Send the error to the error handler
      console.error(err);
    } else {
      //direct user to loginpage 
      res.redirect("/login");
    }
  });
});


///////////////////////////////////////////// HELPERS ///////////////////////////////////////////

/**
 * @desc A helper function to generate a random string
 * @returns a random lorem ipsum string
 */
function generateRandomData(numWords = 5) {
  const str =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";

  const words = str.split(" ");

  let output = "";

  for (let i = 0; i < numWords; i++) {
    output += choose(words);
    if (i < numWords - 1) {
      output += " ";
    }
  }

  return output;
}




/**
 * @desc choose and return an item from an array
 * @returns the item
 */
function choose(array) {
  assert(Array.isArray(array), "Not an array");
  const i = Math.floor(Math.random() * array.length);
  return array[i];
}

module.exports = router;
