'use client';
import { useState, FormEvent, useEffect } from "react";
import Link from 'next/link';
import styles from './page.module.css';

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

    function constructLink(restaurantID: string) {
        let link = "/make-reservation";
        link += "?restaurantID=" + encodeURIComponent(restaurantID);
        link += "&guestCount=" + encodeURIComponent(guestCount);
        if (date != "") link += "&date=" + encodeURIComponent(date);
        return link;
    }

    useEffect(() => { submit() },[]);

    return (
        <div id="find-restaurant">
            <h1>Find a Restaurant</h1>
            <form onSubmit={submit} method="post">
                <div id={styles.filters}> 
                    <input  type="text" name="name" value={name} id={styles.searchRestaurants}
                        placeholder="Restaurant Name (Leave empty to show all)"
                        onChange={(e) => setName(e.target.value)} 
                    />
                    <div className={styles.findInput}>
                        <label htmlFor="date">Day: </label>
                        <input type="date" name="date" value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <div className={styles.findInput}>
                        <label htmlFor="time">Time: </label>
                        <input type="time" name="time" value={time} 
                            onChange={(e) => setTime(e.target.value)} 
                        />
                    </div>
                    <div className={styles.findInput}>
                        <label htmlFor="guestCount">Guest Count: </label>
                        <select name="guestCount" value={guestCount} 
                            onChange={(e) => setGuestCount(e.target.value)}>
                            { [...Array(8)].map((_, i) => (<option key={i} value={i+1}>{i+1}</option>)) }
                        </select>
                    </div> 
                </div>
                <div id={styles.actions}>
                    <button type="submit">Search</button>
                    <a href="/find-reservation">Find or Cancel Reservation</a>
                </div>
            </form>
            <div id={styles.restaurants}>
                { listRestaurantsStatus == "" && 
                    <ul>
                        {restaurants.map((restaurant, index) => (
                            <li key={index}>
                                <Link href={constructLink(restaurant.restaurantID)}
                                    className={styles.restaurant}>
                                    <h2>{restaurant.name}</h2>
                                    <p>{restaurant.address}</p>
                                    <p>Open {restaurant.openingTime} to {restaurant.closingTime}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                }
                { listRestaurantsStatus != "" && <p>{listRestaurantsStatus}</p>}
            </div>
        </div>
    );
}