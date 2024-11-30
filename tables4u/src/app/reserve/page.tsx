'use client';
import { useState, FormEvent, useEffect } from "react";

interface FilterRequestBody {
    filters: {
        name: string;  
        date: string;
        time: string;
        guestCount: string;
        onlyShowAvailableRestaurants: string;
    };
}

export default function List() {
    //form inputs
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [guestCount, setGuestCount] = useState("1");
    const [onlyShowAvailableRestaurants, setOnlyShowAvailableRestaurants] = useState("false");
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //form submit
    const submit = async (e: FormEvent) => {
        e.preventDefault(); //prevent form from reloading page

        //console.log('Form Data:', { name, date, time, guestCount, onlyShowAvailableRestaurants }); //log check if date is correctly captured

        //ensure the date is in YYYY-MM-DD format
        const formattedDate = date;

        //console.log('Formatted Date:', formattedDate); //log formatted date to verify

        let requestBody: FilterRequestBody = {
            filters: {
                name: name || "",  
                date: formattedDate,  
                time,
                guestCount,
                onlyShowAvailableRestaurants
            }
        };

        //console.log("Request Body:", requestBody); //log request body to verify

        //reset data and set loading state
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("https://c63up2fh1i.execute-api.us-east-1.amazonaws.com/i1/ListRestaurants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const data = await response.json();
                //console.log("API Response:", data);  //log API response
                setRestaurants(data.restaurants || []);  //update restaurants list or set empty array
            } else {
                setError("Error fetching data: " + response.statusText);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError("Request failed: " + error.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);  
        }
    };

    async function listActiveRestaurants() {
        setError("Retrieving active restaurants...");
        const response = await fetch("https://c63up2fh1i.execute-api.us-east-1.amazonaws.com/i1/ListRestaurants", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filters: {
                    name: "",
                    date: "",
                    time: "",
                    guestCount: "1",
                    onlyShowAvailableRestaurants: "false"
                }
            }),
        });
        if (response.ok) {
            const data = await response.json();
            //console.log("API Response:", data);  //log API response
            setRestaurants(data.restaurants || []);  //update restaurants list or set empty array
            if(data.restaurants == undefined || data.restaurants.length < 0) {
                setError("No active restaurants");
            } else {
                setError("");
            }
        } else {
            setError("Error fetching data: " + response.statusText);
        }
    }

    useEffect(() => {
        let ignore = false;
        
        if (!ignore)  listActiveRestaurants()
        return () => { ignore = true; }
    },[]);

    return (
         <div id="find-restaurant">
            <h1>Active Restaurants</h1>
            {restaurants.length > 0 ? (
                <ul>
                    {restaurants.map((restaurant, index) => (
                        <li key={index}>
                            <h3>{restaurant.name}</h3>
                            <p>{restaurant.address}</p>
                        </li>
                    ))}
                </ul>
            ):(<br></br>)}
            <p>{error}</p>
         </div>
    );

    // return (
    //     <div id="find-restaurant">
    //         <h1>Find a Restaurant</h1>
    //         <form onSubmit={submit} method="post">
    //             <div>
    //                 {/* Restaurant Name Input */}
    //                 <div className="find-input">
    //                     <label htmlFor="name">Restaurant Name:</label>
    //                     <input 
    //                         type="text" 
    //                         name="name" 
    //                         placeholder="Restaurant Name (Leave empty to show all)"
    //                         value={name} 
    //                         onChange={(e) => setName(e.target.value)} 
    //                     />
    //                 </div>

    //                 {/* Date Input */}
    //                 <div className="find-input">
    //                     <label htmlFor="date">Day:</label>
    //                     <input 
    //                         required 
    //                         type="date" 
    //                         name="date" 
    //                         value={date} 
    //                         onChange={(e) => setDate(e.target.value)} 
    //                     />
    //                 </div>

    //                 {/* Time Input */}
    //                 <div className="find-input">
    //                     <label htmlFor="time">Time:</label>
    //                     <input 
    //                         required 
    //                         type="time" 
    //                         name="time" 
    //                         value={time} 
    //                         onChange={(e) => setTime(e.target.value)} 
    //                     />
    //                 </div>

    //                 {/* Guest Count Input */}
    //                 <div className="find-input">
    //                     <label htmlFor="guestCount">Guest Count:</label>
    //                     <select 
    //                         name="guestCount" 
    //                         value={guestCount} 
    //                         onChange={(e) => setGuestCount(e.target.value)}>
    //                         <option value="1">1</option>
    //                         <option value="2">2</option>
    //                         <option value="3">3</option>
    //                         <option value="4">4</option>
    //                         <option value="5">5</option>
    //                         <option value="6">6</option>
    //                         <option value="7">7</option>
    //                         <option value="8">8</option>
    //                     </select>
    //                 </div> 
    //             </div>
    //             <button type="submit">Search</button>
    //         </form>

    //         {/* Show loading or error */}
    //         {loading && <p>Loading...</p>}
    //         {error && <p>{error}</p>}

    //         {/* Display restaurants if found */}
    //         {restaurants.length > 0 ? (
    //             <ul>
    //                 {restaurants.map((restaurant, index) => (
    //                     <li key={index}>
    //                         <h3>{restaurant.name}</h3>
    //                         <p>{restaurant.address}</p>
    //                     </li>
    //                 ))}
    //             </ul>
    //         ) : (
    //             <p>No restaurants found.</p>
    //         )}
    //     </div>
    // );
}







