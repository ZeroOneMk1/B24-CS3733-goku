import { verify } from '../opt/lib/verify.mjs'
import { connect } from '../opt/lib/connect.mjs'
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
        const restaurantID = (decoded.restaurantID) ? decoded.restaurantID : event.restaurantID;
        const [ selectResult, _selectFields] = await pool.query(
            "select * from restaurants where restaurantID = ?", [restaurantID]);
        
        if (selectResult.length == 0) {
            pool.end();
            return {
                statusCode: 400,
                error: "Invalid restaurant ID"
            }
        }
        const restaurantInfo = selectResult[0];
        
        const [ deleteResult, _deleteFields] = await pool.query(
              "delete from credentials where credentialID = ?", [restaurantInfo.credentialID]);
        
        pool.end();
        return {
            statusCode: 200,
            body: JSON.stringify({ restaurant: restaurantInfo })
        };
    } catch (error) {
        pool.end();
        return {
            statusCode: 400,
            error: "Internal server error: unable to delete restaurant"
        };
    }
};