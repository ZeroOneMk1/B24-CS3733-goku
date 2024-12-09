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
  const { decoded, error: authError } = await verify(event.jwt);
  if (authError)  {
    response = {
      statusCode: 401,
      error: 'User is not authenticated'
    };
    return response;
  } else if (decoded.isAdmin) {
    response = {
      statusCode: 401,
      error: "Administrators cannot close days"
    }
    return response;
  }
  const paramSectionDate = event.date.split("-");
  const paramTsDate = new Date(paramSectionDate[2], paramSectionDate[0], paramSectionDate[1]) ;
  const paramSqlDate = paramSectionDate[2] + "-" + (parseInt(paramSectionDate[0]) + 1) + "-" + (paramSectionDate[1]);
  try {
    futureDay = await FindExistingDay(paramSqlDate, decoded.restaurantID, event.jwt)
  } catch (error) {
    console.log(error)
    response = {
      statusCode:400,
      error: 'Date is not real'
    }
    return response
  }
  let today = new Date()
  if(today >= paramTsDate) { //Checks if the date is in the future
    response = {
      statusCode: 400,
      error: 'Date is in the past'
    }
  } else if(typeof futureDay != undefined && futureDay.length > 0) {   //Checks if the day already exists, creates one if not
    if(futureDay[0].isOpen == true) { //Checks if day is already open
      await CloseExistingDay(paramSqlDate, decoded.restaurantID, event.jwt)
      response = {
        statusCode: 200,
        date: paramTsDate,
        isOpen: 0
      }
    } else {
      response = {
        statusCode: 400,
        error: 'Day is already closed'
      }
    }
  } else { //Case for creating a new day
      await CreateNewDay(event.date, decoded.restaurantID, event.jwt)
      response = {
        statusCode: 200,
        date: paramTsDate,
        isOpen: 0
      }
  }

  pool.end()

  return response;
};


