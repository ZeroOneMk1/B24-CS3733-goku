import mysql from 'mysql'
import crypto from 'crypto'
import { verify } from '../opt/lib/verify.mjs'
export const handler = async (event) => {
  
  var pool = mysql.createPool({
    host: "goku-tables4u.c9agm208se04.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "8hKw4qcyb1XZACCSCvGd",
    database: "tables4u"
  })

  let FindExistingDay = (date, rID, authentificationToken) => {
    return new Promise((resolve, reject) => {
      pool.query("SELECT * FROM days WHERE restaurantID =? AND date=?", [rID, date], (error, rows) => {
        if(error) { return reject(error); }
        return resolve(rows);
      })
    })
  }

  let CloseExistingDay = (date, rID, authentificationToken) => {
    return new Promise((resolve, reject) => {
      pool.query("UPDATE days SET isOpen=false WHERE restaurantID =? AND date=?", [rID, date], (error, rows) => {
        if(error) { return reject(error); }
        return resolve(rows);
      })
    })
  }

  let CreateNewDay = (date, rID, authentificationToken) => {
    return new Promise((resolve, reject) => {
      const dayID = crypto.randomUUID();
      console.log(rID)
      pool.query("INSERT INTO days VALUES (?, ?, ?, ?)", [dayID, date, 0, rID], (error, rows) => {
        if(error) { return reject(error); }
        return resolve(rows);
      })
    })
  }

  let response;
  let  futureDay;
  const { decoded, error: authError } = await verify(event.authentificationToken);
  if (authError)  {
    response = {
      statusCode: 401,
      error: 'User is not authenticated'
    };
    return response;
  } else if (decoded.isAdmin) {
    response = {
      statusCode: 401,
      error: "Administrators cannot modify restaurant information"
    }
    return response;
  }
  try {
    futureDay = await FindExistingDay(event.day, decoded.restaurantID, event.authentificationToken)
  } catch (error) {
    response = {
      statusCode:400,
      error: 'Date is not real'
    }
    return response
  }
  console.log(typeof futureDay)
  let today = new Date()
  const sqlDay = event.day.split("-");
  const paramDate = new Date(sqlDay[0], sqlDay[1] - 1, sqlDay[2])
  if(today >= paramDate) { //Checks if the date is in the future
    response = {
      statusCode: 400,
      error: 'Date is in the past'
    }
  } else if(typeof futureDay != undefined && futureDay.length > 0) {   //Checks if the day already exists, creates one if not
    if(futureDay[0].isOpen == true) { //Checks if day is already open
      await CloseExistingDay(event.day, decoded.restaurantID, event.authentificationToken)
      response = {
        statusCode: 200,
        date: event.day,
        isOpen: false
      }
    } else {
      response = {
        statusCode: 400,
        error: 'Day is already closed'
      }
    }
  } else { //Case for creating a new day
      await CreateNewDay(event.day, decoded.restaurantID, event.authentificationToken)
      response = {
        statusCode: 200,
        date: event.day,
        isOpen: false
      }
  }

  pool.end()

  return response;
};

