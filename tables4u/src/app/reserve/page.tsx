'use client';
import { useState, FormEvent, useEffect } from "react";
import Link from 'next/link';

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

    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [ listRestaurantsStatus, setListRestaurantsStatus ] = useState("Loading...");
    
    //form submit
    async function submit(e?: FormEvent) {
        setListRestaurantsStatus("Loading...");
        if (e) e.preventDefault(); //prevent form from reloading page

        const requestBody: FilterRequestBody = {
            filters: { name, date,time, guestCount, onlyShowAvailableRestaurants: "false" }
        };

        const response = await fetch("https://c63up2fh1i.execute-api.us-east-1.amazonaws.com/i1/ListRestaurants", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        if (result.statusCode == 200) {
            setRestaurants(result.restaurants ?? []);  //update restaurants list or set empty array
            setListRestaurantsStatus("");
        } else setListRestaurantsStatus(result.error);
    };

    useEffect(() => { submit() },[]);

    return (
        <div id="find-restaurant">
            <h1>Find a Restaurant</h1>
            <form onSubmit={submit} method="post">
                <div> 
                    <div className="find-input">                  
                        <label htmlFor="name">Restaurant Name: </label>
                        <input  type="text" name="name" value={name}
                            placeholder="Restaurant Name (Leave empty to show all)"
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    <div className="find-input">
                        <label htmlFor="date">Day: </label>
                        <input type="date" name="date" value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <div className="find-input">
                        <label htmlFor="time">Time: </label>
                        <input type="time" name="time" value={time} 
                            onChange={(e) => setTime(e.target.value)} 
                        />
                    </div>
                    <div className="find-input">
                        <label htmlFor="guestCount">Guest Count: </label>
                        <select name="guestCount" value={guestCount} 
                            onChange={(e) => setGuestCount(e.target.value)}>
                            { [...Array(8)].map((_, i) => (<option key={i} value={i+1}>{i+1}</option>)) }
                        </select>
                    </div> 
                </div>
                <button type="submit">Search</button>
            </form>

            {/* Display restaurants if found */}
            { listRestaurantsStatus == "" && 
                <ul>
                    {restaurants.map((restaurant, index) => (
                        <li key={index}>
                            <Link href={`/make-reservation?restaurantID=${encodeURIComponent(restaurant.restaurantID)}`}>
                                <h3>{restaurant.name}</h3>
                            </Link>
                            <p>{restaurant.address}</p>
                        </li>
                    ))}
                </ul>
            }
            { listRestaurantsStatus != "" && <p>{listRestaurantsStatus}</p>}
        </div>
    );
}