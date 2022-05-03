const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const session = require('express-session');
const path = require('path'); 
const bcrypt = require('bcrypt');
const { Console } = require('console');

// API ROUTER
const apiRoute = require("./routes/api.js");

//Global Variation Declarations
let LoggedUserID="";

//Session Setup
const app = express()
app.use(session({
  secret:"$No0398jn!",
  saveUninitialized:false,
  resave:true

}))



//Bcrpyt
const saltRounds = 5;

// BodyParser Middleware
app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());


 //  View Engines
app.engine(".hbs", expressHandlebars({
	defaultLayout: "main.hbs",
  
}))

// Static Files Help Declaration
app.use(express.static(path.join(__dirname,"public")));


// Rendering Front-End Pages
app.get("/", function(request, response){
	response.render("home.hbs",{ title: "Home | Let's Play" , active: {Home: true }})
})

app.get("/about", function(request, response){
	response.render("about.hbs",{ title: "About Played" , active: {About: true }})
})

app.get("/register", function(request, response){
	response.render("register.hbs",{ title: "Register | Played" , active: {Register: true }})
})

app.get("/login", function(request, response){
	response.render("login.hbs", { title: "Login | Played" , active: {Login: true }})
})

app.get("/contact", function(request, response){
  response.render('contact.hbs',{ title: "Contact Played" , active: {Contact: true }})
  });

let playlistplace="";



//Handle the Login Page Form
app.post("/login", (request,response)=>{

  const user=request.body.user
  const pwd= request.body.pwd
  let query="SELECT * FROM users WHERE username = ?"

  //console.log("Before Login is executed",request.body)
  db.get(query,user,(error,result)=>
    {
      //Run the query that fetches all the users with the Inputted username
      if (error) {
        //
        console.error("BAD",err.message);
      } else {
        if (result) {
        //If the username is found in the DB  
        console.log("Username Found");
        LoggedUserID= result.id;
        //Function that checks hashInputtedPassword vs HashPasswordInTheDb
          bcrypt.compare(pwd, result.password, function(err, result) {
            // result == true
            if (result) {
              console.log("Login Successful");
              console.log("LoggedId:",LoggedUserID)
              console.log("Loggedin Session ID", request.sessionID,"with ID: ",request.session.id)
              request.session.loggedIn=true;
              response.status(200).redirect("/account/dashboard",
              )

            } else {
              //If Password is Wrong
              console.log("Password Wrong");
              response.status(200).redirect("/login?error=10")

              
            }
          });
        } else {
          //If Username does not exist
          console.log("Username no dey oooh")
          response.status(200).redirect("/login?error=12")
        }
      }
      
    })
    
});


//Logout Function
app.get("/logout", function(request, response){
  request.session.destroy(err=>{
    if (err){
      //If the Session doesn't get killed
    }
    else{
      //Session Killed
      console.log("logout done. Bye")
      response.redirect('/');


    }
  }
  );
  });


// MySQLite Database Declaration 
const db = new sqlite3.Database('./db/played_data.db',sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  else {
  console.log('Connected to the played database. Let\'s Play');
  }
});


//Handle the Register Page Form
app.post("/register", (request,response)=>{


  const user=request.body.user;
  const pwd= request.body.pwd;
  // console.log("register",user,pwd);


  bcrypt.hash(pwd, saltRounds, function(err, hash) {
    if (err) {
      response.status(500).redirect("/register");
    } else {
      let query="INSERT INTO users (username,password) VALUES (?,?)"
      console.log("Registration Details Gotten")

      db.run(query,[user,hash],error=>
        {if (error) {
          console.error(error);
          //response.sendStatus(500);
          switch (error.code) {
            case 'SQLITE_CONSTRAINT': 
              response.status(500).redirect("/register?error=19");
              break;
          
            default:
              break;
          }
          
          

        }
        else{
        console.log('Registered a new user to the  database.');
        //response.sendStatus(200);
        response.status(200).redirect("/account/dashboard");
        }
        })
    }
  
    });

});

//View All Musics Page 
app.get("/account/explore", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
  getPlaylist()
  db.all("SELECT * FROM music", function(err, rows) {
    //console.log(rows);
    
    response.render('account/explore.hbs', {
    layout: 'sign.hbs',
    rows:rows,
    playlist:playlistplace,
    title: "Explore Music" , 
    active: {Register: true }
        
    });
  });	

  }
  else{
    response.render("login.hbs")
  }
});

//Get all Playlists for a unique user
function getPlaylist(){
  db.all("SELECT * FROM playlist WHERE user_id=?",LoggedUserID, function(err, playlistrows) {
    if (err){
      //If an Error happens
    }
    else{
      //Successful Execution

      console.log("Getting List of Playlist")
      //console.log("Playlist Update:",playlistrows);
      playlistplace= playlistrows;
    }
  });
}

//My Playlist Page
app.get("/account/playlist", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    //getAllPlaylist()

    db.all("SELECT * FROM playlist WHERE user_id=?",LoggedUserID, function(err, rows) {
      //console.log(rows);
      if (err){
        //If an Error happens
      }
      else{
        //Successful Execution
  
        let allPlaylist=rows;

        //GEt Private Playlist with Filter() Function
        let privatePlaylist = allPlaylist.filter(function (e) {
          return e.status ==="private" ;
        });

        //GEt Public Playlist with Filter() Function
        let publicPlaylist = allPlaylist.filter(function (e) {
          return e.status ==="public" ;
        });
        response.render('account/playlist.hbs', {
        layout: 'sign.hbs',
        allPlaylist, privatePlaylist,publicPlaylist,
        title: "Explore all Playlist" , 
        active: {Register: true }
            
        }); 
      }
    });
  }
  else{
    response.render("login.hbs")
  }
});


//Dashboard Page
app.get("/account/dashboard", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    db.all("SELECT * FROM playlist WHERE status='public'", function(err, rows) {
      //console.log(rows);
      response.render('account/dashboard.hbs', {layout: 'sign.hbs',
      rows:rows,
      title: "Played Dashboard" , 
      active: {Register: true}
          
      });
    
  });

  }
  else{
    response.render("login.hbs")
  }
});



//All Users Page
app.get("/account/users", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    db.all("SELECT username FROM users", function(err, rows) {
      response.render('account/users.hbs', {layout: 'sign.hbs',
      rows:rows,
      title: "All Users | Played",
      active: {Register: true}
          
      });
    
  });

  }
  else{
    response.render("login.hbs")
  }
});

//Search for Users 
app.get("/users/search", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    let string = request.query.q;
      db.all('SELECT * FROM users WHERE username LIKE "%'+string+'%"', function(err, rows) {
        if(rows==""){
          response.status(200).redirect("/account/users?search=none");
        }
        else{
          response.render('account/users.hbs', {
          layout: 'sign.hbs',
          rows:rows,
          string,
          active: {Register: true}
        });
        }
        
    });
  
  }
  else{
    response.render("login.hbs")
  }
});


//View all the Playlist from one User with his username
app.get("/account/users/:user", function(request, response){

  if (request.session.loggedIn && request.session.loggedIn==true) {
    
  let UserList=true;
  let username=request.params['user'];

    //Start
    db.get("SELECT id FROM users WHERE username=?", username, function(err, rows) {

      if (err){
        //If an Error happens
        response.status(400).redirect("/account/users");

      }
      else{
        console.log("Users ID:",rows.id);        
        let query="SELECT * FROM playlist WHERE id =?";
        db.all("SELECT * FROM playlist WHERE user_id =?", rows.id, function(error, rows) 
        { 
          if (error) 
          {
          response.status(400).redirect("/account/users");
          }
          else{
            allPlaylist=rows;
            console.log("All Playlist:",allPlaylist)
            response.render('account/playlist.hbs', {layout: 'sign.hbs',
            allPlaylist,UserList,username,
            title: "Played Dashboard" , 
            active: {Register: true}
            });
          }
        });
        
      }
      
    });	
    //EndIf

  }
  else{
    response.render("login.hbs")
  }
});

//redirect to Playlist Page
app.get("/account/create", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    response.render('account/create.hbs', {layout: 'sign.hbs',
    title: "Create new Playlist", 
    active: {Register: true }
  });
  }
  else{
    response.render("login.hbs")
  }
});

//Edit Playlist Page
app.get("/account/edit/:playID", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    let playID=request.params['playID'];
    db.all("SELECT * FROM playlist WHERE id=?", playID, function(err, rows) {
      console.log("Fetching Details of Playlist:",rows);
      let PlaylistName = rows[0].name
      let PlaylistStatus = rows[0].status
      response.render('account/edit.hbs', {layout: 'sign.hbs',
      title: "Edit Playlist", 
      PlaylistName,PlaylistStatus,
      active: {Register: true }
      });

    });
  }
  else{
    response.render("login.hbs")
  }
});

//Delete Playlist Action
app.get("/account/delete/:playID", function(request, response){
  
  if (request.session.loggedIn && request.session.loggedIn==true) {

    let playID=request.params['playID'];

    db.all("DELETE FROM playlist WHERE id=?", playID, function(err, rows) {

      console.log("Playlist Destroyed");
      response.redirect('/account/playlist?delete=success',301)

    });
  }
  else{
    response.render("login.hbs")
  }
});

//Update Existing Playlist Page
app.get("/savePlaylist/:playID", function(request, response){
  //Insert to the Db
  let query="UPDATE playlist SET songs=? AND status=? WHERE id=?"
  db.run(query,[PlayName, LoggedUserID,PrivCheck,timestamp],error=>
    {if (error) {
      console.error(error);
          response.status(500).redirect("/create?error=19");
    }
    else{
    console.log('Another Playlist Created Successfully');
    //response.sendStatus(200);
    response.status(200).redirect("/account/playlist?success=10");
    }
    })
});


//Search for Playlist 
app.get("/account/search", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {
    let string = request.query.q;
    console.log(string);
      db.all('SELECT * FROM playlist WHERE name LIKE "%'+string+'%" AND status="public"', function(err, rows) {
        console.log(rows);
        if(rows==""){
          response.status(200).redirect("/account/dashboard?search=none");
        }
        else{
          //console.log(rows)
          response.render('account/dashboard.hbs', {
          layout: 'sign.hbs',
          rows:rows,
          string,
          title: "Played Dashboard" , 
          active: {Register: true}
        });
        }
        
    });
  
  }
  else{
    response.render("login.hbs")
  }
});


//Create Playlist Form Function
app.post("/createPlaylist", function(request, response){

  if (request.session.loggedIn && request.session.loggedIn==true) {
  //Get Playlist Name
  const PlayName=request.body.playlistname;
  let songs="";

  //Check Private Checkbox
  let PrivCheck="";
  if (request.body.privatecheck) {
    console.log("Private Playlist check");
    PrivCheck= "private";

  } else {
    PrivCheck= "public";
    console.log("Public Playlist checck");
  }
  //TimeStamp Declaration & Setup
  let ts = Date.now();
  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  let timestamp= year + "-" + month + "-" + date + " | " + hours + ":" + minutes + ":" + seconds

    //Insert to the Db
  let query="INSERT INTO playlist (name,user_id,status,songs,date) VALUES (?,?,?,?,?)"
  db.run(query,[PlayName, LoggedUserID,PrivCheck,songs,timestamp],error=>
    {if (error) {
      console.error(error);
          response.status(500).redirect("/create?error=19");
    }
    else{
    console.log("CreatePlaylist Session ID", request.sessionID,"with ID: ",request.session.id)
    console.log('Another Playlist Created Successfully');
    //response.sendStatus(200);
    response.status(200).redirect("/account/playlist?success=10");
    }
    })
}
else{
  response.render("login.hbs")
}

});



//Get all the Songs from a Playlist with the ID
//Playlist Detail Page
app.get("/account/playlist-detail/:playID", function(request, response){

  if (request.session.loggedIn && request.session.loggedIn==true) {
    
  let Play_List="";
  let playID=request.params['playID'];

    //Start
    db.all("SELECT * FROM playlist WHERE id=?", playID, function(err, rows) {

      if (err){
        //If an Error happens
        response.status(500).redirect("/account/playlist");

      }
      else{

        //Successful Execution
        Play_List=rows
        let PlaylistName=Play_List[0].name
        let PlaylistId=Play_List[0].id
        let editAccess= false;
        //console.log("Playlist Content:",Play_List);
    
        if (Play_List[0].songs===null) { //Elaborate  function
          response.status(500).redirect("/account/playlist-detail/update=empty");
        } 
        else {
          
          Play_List[0].songs = Play_List[0].songs.split("|")
          let array = Object(Play_List[0].songs).join("','");
          array= "'"+ array+"'"

          let query="SELECT * FROM music WHERE id IN (" + array + ")";
          db.all(query,function(error, rows) 
          { if (error) {
            response.status(500).redirect("/account/playlist-detail/update=empty");
          }
          else{
            if (Play_List[0].user_id == LoggedUserID) {
                editAccess= true;
            } 
            response.render('account/playlist-detail.hbs',{
            layout: 'sign.hbs',
            rows: rows, PlaylistName,PlaylistId,
            editAccess,
            active: {Register: true }
                
            });
          }
          })
        }
      }
      
    });	
    //EndIf

  }
  else{
    response.render("login.hbs")
  }
});


//Save Music to Playlist
app.get("/addtoplaylist/:playID/:musicID", function(request, response){
  if (request.session.loggedIn && request.session.loggedIn==true) {

  let Songs_List="";
  let playID=request.params['playID'];
  let musicID=request.params['musicID']

  db.all("SELECT songs FROM playlist WHERE id=?", playID, function(err, rows) {
    Songs_List=rows[0].songs;
    console.log("Previous Song in Playlist:",Songs_List);

    if (!Songs_List) { //Elaborate  function
      console.log("Saving to Playlist Process Started & Empty Column")
      Songs_List=musicID;
      let query="UPDATE playlist SET songs=? WHERE id=?";
      db.run(query,[Songs_List,playID],error=>
      {
        if (error) {
          console.error(error);
          response.status(500).redirect("/account/explore");
        }
        else{
        console.log('Fresh Song saved to Playlist');
        //response.sendStatus(200);
        response.status(200).redirect("/account/explore");
        }
      })
    } else {
      if (Songs_List.split('|').includes(musicID)) {
        response.status(200).redirect("/account/explore?status=unsuccessful");
        
      } else {
        console.log("Saving to Playlist Process Started")
        console.log("Songs already exist in this playlist")
        console.log("Before ", Songs_List)
        Songs_List=Songs_List+ "|"+ musicID;
        console.log("After :", Songs_List)
        let query="UPDATE playlist SET songs=? WHERE id=?";
        db.run(query,[Songs_List,playID],error=>
        {if (error) {
          console.error(error);
          response.status(500).redirect("/account/explore");
        }
        else{
        console.log('Song saved to Playlist');
        //response.sendStatus(200);
        response.status(200).redirect("/account/explore?status=successful");
        }
        })
      }
      
    }


  });	

}
else{
  response.render("login.hbs")
}
  
});

app.use("/api", apiRoute);

app.listen(8080)