import { connect } from "../opt/lib/connect.mjs";

export const handler = async (event) => {
    let datestring = event.filters.date;
    let requestedDate;
    if (datestring !== "") {
        try {
            requestedDate = new Date(datestring);
            // Format: YYYY-MM-DD
            // write a regex to match this format for any date.
            // 1-1-1 should also be a valid date for january 1st, 1 AD. NO ASSUMING LENGTH!
            const dateRegex = /^(\d+)-(\d+)-(\d+)$/;
            const [_, year, month, day] = datestring.match(dateRegex);

            if (month > 12 || month < 1 || day > 31 || day < 1) {
                throw new Error("Invalid date");
            } else if (month === 2 && day > 28) {
                throw new Error("Invalid date");
            } else if ([4, 6, 9, 11].includes(month) && day > 30) {
                throw new Error("Invalid date");
            }
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

    // try {
    let query;
    const filters = event.filters;
    // TRUE if a date is provided, false otherwise.
    const onlyShowAvailableRestaurants = filters.date !== "";
    /**
     * If a filter is null, do not include it in the query.
     * filters: {
     * “name" : “DAKA” | "",
     * “date" : “12-30-2024” | "",
     * “time" : “20:00” | "",
     * “guestCount" : “4”,
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
    let restaurantIDs;
    let restauranterror;
    // IF name is not null
    if (filters.name !== "") {
        // Find restaurantIDs that fit the name query using partial matching.
        query = `SELECT restaurantID FROM restaurants WHERE name LIKE ? AND isActive = true`; //  
        const searchTerm = `%${filters.name}%`;
        [restaurantIDs, restauranterror] = await pool.query(query, [searchTerm]);
        if (restaurantIDs.length === 0) {
            pool.end();
            return {
                statusCode: 200,
                restaurants: []
            };
        }
    } else {
        // Find all restaurantIDs.
        query = `SELECT restaurantID FROM restaurants WHERE isActive = true`; //  
        [restaurantIDs, restauranterror] = await pool.query(query);
        if (restaurantIDs.length === 0) {
            pool.end();
            return {
                statusCode: 200,
                restaurants: []
            };
        }
    }

    let finalRestaurantInfos;
    let restaurantError;
    if (onlyShowAvailableRestaurants) {
        // Find the DayIDs for the requested date and restaurantIDs.
        let dayIDs;
        let dayerror;

        // find the tables that can fit the guest count
        let tablesthatfit;
        query = `SELECT tableID, seats FROM tables WHERE seats >= ? AND restaurantID IN (?)`;
        [tablesthatfit, tableerror] = await pool.query(query, [filters.guestCount, restaurantIDs]);
        if (tablesthatfit.length === 0) {
            pool.end();
            return {
                statusCode: 200,
                restaurants: []
            };
        }
        let tableIDs = tablesthatfit.map(table => table.tableID);
        // filter the restaurants that don't have tables that can fit the guest count
        query = `SELECT restaurantID FROM tables WHERE tableID IN (?)`;
        [restaurantIDs, restauranterror] = await pool.query(query, [tableIDs]);
        if (restaurantIDs.length === 0) {
            pool.end();
            return {
                statusCode: 200,
                restaurants: []
            };
        }
        restaurantIDs = restaurantIDs.map(restaurant => restaurant.restaurantID);
        // remove duplicates
        restaurantIDs = [...new Set(restaurantIDs)];
        let store_restaurantIDs = restaurantIDs;
        // Find the DayIDs for the requested date and restaurantIDs.
        query = `SELECT dayID FROM days WHERE date = ? AND isOpen = true AND restaurantID IN (?)`;
        [dayIDs, dayerror] = await pool.query(query, [datestring, restaurantIDs]);
        
        // find restaurants that have that day open
        query = `SELECT restaurantID FROM days WHERE dayID IN (?)`;
        [restaurantIDs, restauranterror] = await pool.query(query, [dayIDs]);

        // find difference between store_restaurantIDs and restaurantIDs
        let noDayRestaurantIDs = store_restaurantIDs.filter(x => !restaurantIDs.includes(x));
        noDayRestaurantIDs = noDayRestaurantIDs.map(restaurant => restaurant.restaurantID);
        
        let finalRestaurantIDs = noDayRestaurantIDs; // Store for later. Do more filtering on those that *do* have a day.

        if (filters.time !== ""){
            // for each table in tablesthatfit, find reservations on that day at that time.
            let reservationIDs;
            let reservationerror;
            query = `SELECT reservationID FROM reservations WHERE dayID IN (?) AND time = ?`;
            [reservationIDs, reservationerror] = await pool.query(query, [dayIDs, filters.time]);

            // remove tables from tablesthatfit that have reservations
            query = `SELECT tableID FROM reservations WHERE reservationID IN (?)`;
            let reservedTables;
            [reservedTables, tableerror] = await pool.query(query, [reservationIDs]);
            let reservedTableIDs = reservedTables.map(table => table.tableID);
            tablesthatfit = tablesthatfit.filter(table => !reservedTableIDs.includes(table.tableID));
            tableIDs = tablesthatfit.map(table => table.tableID);
            // find restaurants that have tables that are not reserved
            query = `SELECT restaurantID FROM tables WHERE tableID IN (?)`;
            [restaurantIDs, restauranterror] = await pool.query(query, [tableIDs]);
            restaurantIDs = restaurantIDs.map(restaurant => restaurant.restaurantID);
            // remove duplicates
            restaurantIDs = [...new Set(restaurantIDs)];
            // add theses restaurants to the finalRestaurantIDs
            finalRestaurantIDs = finalRestaurantIDs.concat(restaurantIDs);

            // Get the info!
            query = 'SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)';
            [finalRestaurantInfos, restaurantError] = await pool.query(query, [finalRestaurantIDs]);
        }else{
            // find all reservations for that day
            let reservationIDs;
            let reservationerror;
            query = `SELECT reservationID FROM reservations WHERE dayID IN (?)`;
            [reservationIDs, reservationerror] = await pool.query(query, [dayIDs]);
            // find tables that are not reserved
            query = `SELECT tableID FROM reservations WHERE reservationID IN (?)`;
            let reservedTables;
            [reservedTables, tableerror] = await pool.query(query, [reservationIDs]);
            let reservedTableIDs = reservedTables.map(table => table.tableID);
            tablesthatfit = tablesthatfit.filter(table => !reservedTableIDs.includes(table.tableID));
            tableIDs = tablesthatfit.map(table => table.tableID);
            // find restaurants that have tables that are not reserved
            query = `SELECT restaurantID FROM tables WHERE tableID IN (?)`;
            [restaurantIDs, restauranterror] = await pool.query(query, [tableIDs]);
            restaurantIDs = restaurantIDs.map(restaurant => restaurant.restaurantID);
            // remove duplicates
            restaurantIDs = [...new Set(restaurantIDs)];
            // add theses restaurants to the finalRestaurantIDs
            finalRestaurantIDs = finalRestaurantIDs.concat(restaurantIDs);

            // Get the info!
            query = 'SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)';
            [finalRestaurantInfos, restaurantError] = await pool.query(query, [finalRestaurantIDs]);
        }
        
    } else {
        // Find the restaurant information for the restaurantIDs.
        query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
        restaurantIDs = restaurantIDs.map(restaurant => restaurant.restaurantID);
        [finalRestaurantInfos, restaurantError] = await pool.query(query, [restaurantIDs]);
    }
    pool.end();
    return {
        statusCode: 200,
        restaurants: finalRestaurantInfos
    };
    // } catch (error) {
    //     return {
    //         statusCode: 500,
    //         error: "Internal server error",
    //         error_verbose: error.message
    //     };
    // }

};