import mysql from 'mysql'
import crypto from 'crypto'
//import { randomUUID, createHash } from 'crypto';

export const handler = async (event) => {
  // TODO implement
  var pool = mysql.createPool({
    host : "goku-tables4u.c9agm208se04.us-east-1.rds.amazonaws.com",
    user : "admin",
    password : "8hKw4qcyb1XZACCSCvGd",
    database : "tables4u"
  })

   let checkUsernameExists = (username) => {
    return new Promise((resolve, reject) => {
      pool.query("SELECT * FROM credentials WHERE username = ?", [username], (error, rows) => {
        if (error) {
          return reject(error);
        }
        return resolve(rows.length > 0); //true if name exists
      });
    });
  };

  let checkRestaurantNameExists = (name) => {
    return new Promise((resolve, reject) => {
      pool.query("SELECT * FROM restaurants WHERE name = ?", [name], (error, rows) => {
        if (error) {
          return reject(error);
        }
        return resolve(rows.length > 0); //true if name exists
      });
    });
  };

  let CreateCredentials = (username, password) => {
    return new Promise((resolve, reject) => {
      const credentialID = crypto.randomUUID(); 
      const hashPass = crypto.createHash('sha256').update(password).digest('hex');
      pool.query("insert into credentials values(?, ?, ?)", [credentialID, username, hashPass], (error, rows) => {
        if (error) {return reject(error); }
        return resolve(credentialID);
        })
    })
  }

  let CreateRestaurant = (name,	address, credentialID) => {
    return new Promise((resolve, reject) => { 
      const restaurantID = crypto.randomUUID(); 

      pool.query("insert into restaurants values(?,?,?,?,?,?,?)", [restaurantID,	name,	address, 0,	null, null, credentialID], (error, rows) => {
        if (error) {return reject(error); }
        return resolve(rows);
        })
      
      
    })
  }

  try {
    const usernameExists = await checkUsernameExists(event.username);
    if (usernameExists) {
      throw new Error('Username is already taken.');
    }

    const restaurantExists = await checkRestaurantNameExists(event.name);
    if (restaurantExists) {
      throw new Error('Restaurant name is already taken.');
    }

    const credentialID = await CreateCredentials(event.username, event.password);

    const rest_result = await CreateRestaurant(event.name, event.address, credentialID);

    // Success response
    const response = {
      statusCode: 200,
      result: {
        "name": event.name,
        "address": event.address
      }
    };

    pool.end();

    return response;

  } catch (error) {
    pool.end();

    return {
      statusCode: 500,
      error: "Internal server error: unable to create restaurant"
    };
  }
};
