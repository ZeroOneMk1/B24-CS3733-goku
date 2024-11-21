import { connect } from "../opt/lib/connect.mjs";

export const handler = async (event) => {
    let datestring = event.filters.date;
    try {
        const requestedDate = new Date(datestring);
    } catch (error) {
        return {
            statusCode: 400,
            error: "Invalid date"
        };
    }
    const now = new Date();
    if (now > requestedDate) {
        return {
            statusCode: 400,
            error: "Date is not in the future"
        };
    }

    if (event.filters.guestCount < 1 || event.filters.guestCount > 8) {
        return {
            statusCode: 400,
            error: "Guest count is not in range 1-8"
        };
    }

    // create database connection
    const { pool, error: dbError } = await connect();
    if (dbError) return {
        statusCode: 500,
        error: "Unable to create database connection"
    };

    try {
        const filters = event.filters;
        const onlyShowAvailableRestaurants = filters.onlyShowAvailableRestaurants === "true";
        /**
         * If a filter is null, do not include it in the query.
         * filters: {
         * “name" : “DAKA” | null,
         * “date" : “12-30-2024” | null,
         * “time" : “20:00” | null,
         * “guestCount" : “4” | null,
         * “onlyShowAvailableRestaurants" : “false” | “true” //  A restaurant is unavailable if there are no tables available for the requested date, time, and number of guests.
         * }
         * 
         * Restaurants table:
         * restaurantID	name	address	credentialID	isActive	openingTime	closingTime
         * Reservations table:
         * reservationID	dayID	tableID	customerCount	email	confirmationCode	time // A reservation for a table makes it unavailable for that day and time.
         * Tables table:
         * tableID	seats	restaurantID // A table is unavailable if it is reserved for the requested date and time. It is also unavailable if it has fewer seats than the requested number of guests.
         * Days table:
         * dayID	date	isOpen	restaurantID // A restaurant is unavailable if it is not open on the requested date.
         * 
         * return: {
         *  “restaurants" : [<RestaurantInfo>, ...] | []
         * }
         * where RestaurantInfo is:
         * {
         *  “name" : string,
         *  “address" : string,
         *  “isActive" : "true” | "false",
         *  “openingTime" : "7:00” | "7",
         *  “closingTime" : "19:00” | "19"
         * }
        */
        // write a ListRestaurants query using all the filters.

        // IF name is not null
        if (filters.name !== null) {
            // Find restaurantsIDs that fit the name query.
            query = `SELECT restaurantID FROM Restaurants WHERE name = ? AND isActive = true`;
            const [restaurantIDs, restauranterror] = await pool.query(query, [filters.name]);
            if (restauranterror) return {
                statusCode: 500,
                error: "Internal server error: unable to query restaurants"
            };
            if (restaurantIDs.length === 0) return {
                statusCode: 200,
                restaurants: []
            };
        }else{
            // Find all restaurantIDs.
            query = `SELECT restaurantID FROM Restaurants WHERE isActive = true`;
            const [restaurantIDs, restauranterror] = await pool.query(query);
            if (restauranterror) return {
                statusCode: 500,
                error: "Internal server error: unable to query restaurants"
            };
            if (restaurantIDs.length === 0) return {
                statusCode: 200,
                restaurants: []
            };
        }
        if (onlyShowAvailableRestaurants) {
            // Find the DayIDs for the requested date and restaurantIDs.
            if (filters.date !== null) {
                query = `SELECT dayID FROM Days WHERE date = ? AND isOpen = true AND restaurantID IN (?)`;
                const [dayIDs, dayerror] = await pool.query(query, [datestring, restaurantIDs]);
                if (dayerror) return {
                    statusCode: 500,
                    error: "Internal server error: unable to query days"
                };
                if (dayIDs.length === 0) return {
                    statusCode: 200,
                    restaurants: []
                };
            }else{
                query = `SELECT dayID FROM Days WHERE isOpen = true AND restaurantID IN (?)`;
                const [dayIDs, dayerror] = await pool.query(query, [restaurantIDs]);
                if (dayerror) return {
                    statusCode: 500,
                    error: "Internal server error: unable to query days"
                };
                if (dayIDs.length === 0) return {
                    statusCode: 200,
                    restaurants: []
                };
            }
            // Find ReservationIDs for the requested dayIDs at the given time.
            if(filters.time !== null){
                query = `SELECT reservationID FROM Reservations WHERE dayID IN (?) AND time = ?`;
                const [reservationIDs, reservationerror] = await pool.query(query, [dayIDs, filters.time]);
                
                if (reservationerror) return {
                    statusCode: 500,
                    error: "Internal server error: unable to query reservations"
                };
                if (reservationIDs.length === 0) return {
                    statusCode: 200,
                    restaurants: []
                };
            } else {    
                query = `SELECT reservationID FROM Reservations WHERE dayID IN (?)`;
                const [reservationIDs, reservationerror] =
                    await pool.query(query, [dayIDs]);
                if (reservationerror) return {
                    statusCode: 500,
                    error: "Internal server error: unable to query reservations"
                };
                if (reservationIDs.length === 0) return {
                    statusCode: 200,
                    restaurants: []
                };
            }
            // Find TableIDs for the requested reservationIDs.
            query = `SELECT tableID FROM Reservations WHERE reservationID IN (?)`;
            const [tableIDs, tableerror] = await pool.query(query, [reservationIDs]);
            if (tableerror) return {
                statusCode: 500,
                error: "Internal server error: unable to query tables"
            };
            // Now we have the tables that are in use at the requested date and time and restaurant.
            // We need to find the tables NOT included in this list, but INCLUDED in the restaurantIDs list.
            query = `SELECT tableID, seats, restaurantID FROM Tables WHERE restaurantID IN (?)`;
            const [allTables, allTablesError] = await pool.query(query, [restaurantIDs]);
            if (allTablesError) return {
                statusCode: 500,
                error: "Internal server error: unable to query tables"
            };
            // Filter out the tablesIDs that are in use.
            let availableTables = allTables.filter(table => !tableIDs.includes(table.tableID));
            // Filter out the tables that are too small.
            availableTables = availableTables.filter(table => table.seats >= filters.guestCount);
            // Find the restaurantIDs these tables belong to.
            const availableRestaurantIDs = availableTables.map(table => table.restaurantID);
            // Find the restaurant information for these restaurantIDs.
            query = `SELECT name, address, isActive, openingTime, closingTime FROM Restaurants WHERE restaurantID IN (?)`;
            const [restaurants, restaurantError] = await pool.query(query, [availableRestaurantIDs]);
            if (restaurantError) return {
                statusCode: 500,
                error: "Internal server error: unable to query restaurants"
            };
        } else {
            // Find the restaurant information for the restaurantIDs.
            query = `SELECT name, address, isActive, openingTime, closingTime FROM Restaurants WHERE restaurantID IN (?)`;
            const [restaurants, restaurantError] = await pool.query(query, [restaurantIDs]);
            if (restaurantError) return {
                statusCode: 500,
                error: "Internal server error: unable to query restaurants"
            };
        }
        return {
            statusCode: 200,
            restaurants: restaurants
        };
    } catch (error) {
        return {
            statusCode: 500,
            error: "Internal server error",
            error_verbose: error.message
        };
    }

};