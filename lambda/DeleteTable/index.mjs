import mysql from 'mysql';
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  const { decoded, error: authError } = await verify(event.jwt);
	if (authError) return {
		statusCode: 401,
		error: authError
	}

	if (decoded.isAdmin) return {
		statusCode: 401,
		error: "Administrators cannot modify restaurant information"
	}

  const pool = mysql.createPool({
    host : "goku-tables4u.c9agm208se04.us-east-1.rds.amazonaws.com",
    user : "admin",
    password : "8hKw4qcyb1XZACCSCvGd",
    database : "tables4u"
  });

  let checkTableExists = () => {
    return new Promise((resolve, reject) => {
      pool.query("select * from tables where number = ? and restaurantID = ?",
      [event.number, decoded.restaurantID], (error, rows) => {
        if (error) return reject(error);
        return resolve(rows.length > 0);
      });
    });
  };

  let deleteTable = () => {
    return new Promise((resolve, reject) => {
      pool.query("delete from tables where number = ? and restaurantID = ?",
        [event.number, decoded.restaurantID], (error, rows) => {
        if (error) return reject(error);
        return resolve();
      });
    })
  }

  let updateTables = () => {
    return new Promise((resolve, reject) => {
      pool.query("update tables set number = number - 1 where number > ? and restaurantID = ?",
        [event.number, decoded.restaurantID], (error, rows) => {
        if (error)return reject(error); 
        return resolve();
      });
    })
  }

  let getTables = () => {
    return new Promise((resolve, reject) => {
      pool.query("select number, seats from tables where restaurantID = ? order by number",
      [decoded.restaurantID], (error, rows) => {
        if (error) return reject(error);
        return resolve(rows);
      });
    })
  }

  try {
    const tableExists = await checkTableExists();
    if (!tableExists) {
      pool.end();
      return {
        statusCode: 400,
        error: 'Table number or restaurantID not found'
      };
    }

    await deleteTable();
    await updateTables();
    const tables = await getTables();

    pool.end();
    return {
      statusCode: 200,
      body: JSON.stringify({ tables })
    }

  } catch (error) {
    pool.end();
    return {
      statusCode: 500,
      error: "Internal server error: unable to delete table"
    };
  }
};
  
  
  


