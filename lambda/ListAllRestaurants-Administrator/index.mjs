import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
    const { decoded, error: authError } = await verify(event.jwt);
    if (authError) return {
        statusCode: 401,
        error: authError
    }

    if (decoded.isAdmin != true) return {
        statusCode: 401,
        error: "User not authenticated"
    }

    // create database connection
    const { pool, error: dbError } = await connect();
    if (dbError) return {
        statusCode: 500,
        error: "Unable to create database connection"
    };

    try {
        let query;
        let finalRestaurantInfos;
        let restaurantError;
        query = `SELECT restaurantID, name, address, isActive, openingTime, closingTime FROM restaurants`;
        [finalRestaurantInfos, restaurantError] = await pool.query(query);
        pool.end();
        return {
            statusCode: 200,
            restaurants: finalRestaurantInfos
        };
    } catch (error) {
        pool.end();
        return {
            statusCode: 500,
            error: "Internal server error",
            error_verbose: error.message
        };
    }

};