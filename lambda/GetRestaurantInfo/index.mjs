import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  const { decoded, error: authError } = await verify(event.jwt);
  if (authError) return {
    statusCode: 401,
    error: "Unauthorized"
  }

  if (decoded.isAdmin && !event.restaurantID) return {
    statusCode: 400,
    error: "Restaurant ID not provided with administrator request"
  }

  // create database connection
  const { pool, error: dbError } = await connect();
  if (dbError) return {
    statusCode: 500,
    error: "Unable to create database connection"
  };

  try {
    // grab restaurant info
    const restaurantID = (event.restaurantID) ? event.restaurantID : decoded.restaurantID;
    const [getInfoResults, _getInfoFields] = await pool.execute(
        "select * from restaurants where restaurantID = ?", [restaurantID]);

    // make sure a restaurant was matched
    if (getInfoResults.length == 0) {
      pool.end();
      return {
          statusCode: 400,
          error: "Invalid restaurant"
      }
    }

    // grab tables
    const [getTablesResults, _getTablesFields] = await pool.execute(
      "select number, seats from tables where restaurantID = ? order by number", [restaurantID]);

    pool.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        restaurantInfo: getInfoResults[0],
        tables: getTablesResults
      }),
    };
  } catch (error) {
    pool.end();
    return {
      statusCode: 500,
      error: "Internal server error: unable to get restaurant info"
    };
  }
};