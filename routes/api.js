//Required Packages
const express = require("express");

const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require('sqlite3');


const SECRET_KEY = "a458lknlotjninoninlnoiökmimiop096";

// MySQLite Database
const db = new sqlite3.Database('./db/played_data.db',sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Connection Error:');
        console.error(err.message);
    }
    else {
    console.log('Connect to the played database Done. Let\'s Play');
    
    }
});

//
const check = async (request,response)=>{
    return response.status(200).json({
        response: "API is working ",
    });
};


// 1) generate jwt when the user logged in
router.post("/webtoken", async  (request, response)=> {
    const grant_type = request.body.grant_type;
    const username = request.body.username;
    const password = request.body.password; 

    let query="SELECT * FROM users WHERE username = ?"

    if (grant_type != "password") {
        return response.status(400).json({
            error: "unsupported_grant_type",
        });
    }  

    //empty inputs
    if (!username || !password) {
        return response.status(400).json({
        error: "Invalid_request",
        message: "username or password is empty!",
        });
    }


    await db.get(query,username,(error,result) =>{
        if (!result) {
            return response.status(400).json({
            error: "invalid_client",
            message: "Enter a valid username.",
        });
        } else {
            // username exist then check for password
            const isAuthenticated =  bcrypt.compare(password, result.password);
            if (!isAuthenticated) {
                console.log("Wrong")
                return response.status(400).json({
                error: "invalid_client",
                message: "password is not correct!",
            });
            }
            // user is authenticated
            // generate json web token
            const payload = {
                preffered_username: result.username,
                sub: result.id,
            };
            jwt.sign(payload, SECRET_KEY, function (error, token) {
                response.status(200).json({
                access_token: token,

                });
            });
        }
    })

});



router.post("/check", check);


module.exports = router;
