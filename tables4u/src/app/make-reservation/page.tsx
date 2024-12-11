"use client";

import React, { useEffect, useState } from 'react';

import ReservationInfo from '../(reservations)/ReservationInfo';
import styles from './page.module.css';

interface MakeReservationBody {
    name: string;
    email: string;
    restaurant: string;
    date: string;
    time: string;
    customerCount: string;
}

interface GetRestaurantInfoResponse {
    restaurantInfo: {
        restaurantID: string;
        name: string;
        address: string;
        isActive: number;
        openingTime: number;
        closingTime: number;
        credentialID: string;
    };
    tables: {
        number: number;
        seats: number;
    }[];
}

export default function MakeReservation({ searchParams }:
    { searchParams: { restaurantID: string, guestCount: string, date?: string}}) {
    const restaurantID = searchParams.restaurantID;

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [restaurant, setRestaurant] = useState<{ name: string; address: string }>({ name: '', address: '' });
    const [restaurantInfo, setRestaurantInfo] = useState<GetRestaurantInfoResponse | null>(null);

    // run getAvailableTimes when date or guestCount changes
    const [guestCount, setGuestCount] = useState(searchParams.guestCount);
    const [date, setDate] = useState( searchParams.date ?? "");
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [reservationCode, setReservationCode] = useState<number>(0);
    const [formattedDate, setFormattedDate] = useState<string>("No date set");

    let hasReserved = !!reservationCode;

    const getAvailableTimes = async (day: string, guestCount: number) => {
        setLoading(true);
        setMessage("Getting Available Times");
        setTime('');
        console.log('Getting available times for', day, 'with', guestCount, 'guests');
        console.log('Restaurant Info:', restaurantInfo);
        
        if (!restaurantInfo) return;
        
        const openingTime = restaurantInfo.restaurantInfo.openingTime;
        const closingTime = restaurantInfo.restaurantInfo.closingTime;
        const times: string[] = [];
        const calls: Promise<Response>[] = [];
        for (let i = openingTime; i < closingTime; i++) {
            const call = fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListRestaurants", {
                method: "POST",
                body: JSON.stringify({ filters: { name: restaurant.name, date: day, time: i.toString(),
                    guestCount: guestCount.toString(), onlyShowAvailableRestaurants: 'true' } }),
            });
            calls.push(call);
            await new Promise(r => setTimeout(r, 100)); // 100ms delay
        }

        const responses = await Promise.all(calls);
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const time = openingTime + i;
            const data = await response.json();
            if (data.restaurants && data.restaurants.length > 0) times.push(time.toString());
        }

        setAvailableTimes(times);

        if (times.length === 0) setMessage("No available times found");
        else setMessage("");

        setLoading(false);
    };

    async function fetchRestaurantInfo() {
        const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo", {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ restaurantID }),
        });

        console.log(response);
        const data = await response.json();
        setRestaurantInfo(JSON.parse(data.body));
        setRestaurant({
            name: JSON.parse(data.body).restaurantInfo.name,
            address: JSON.parse(data.body).restaurantInfo.address
        });
    }

    useEffect(() => { fetchRestaurantInfo() }, []);
    useEffect(() => {
        if (date && guestCount && restaurantInfo)
            getAvailableTimes(date, parseInt(guestCount));
    }, [date, guestCount, restaurantInfo]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
    
        // Handle form submission logic here
        console.log(`Name: ${name}, Email: ${email}, Time: ${time}`);
        const payload: MakeReservationBody = {
            name: name,
            email: email,
            restaurant: restaurant.name,
            date: date,
            time: time,
            customerCount: guestCount,
        };
        console.log('Payload:', payload);

        const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/MakeReservation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        let data = await response.json();
        data = JSON.parse(data.body);
        console.log('Reservation Response:', data);
        setReservationCode(data.confirmationCode);
    };

    if (!restaurantInfo) {
        return (
            <div id={styles.wrapper}>
                <div id={styles.panel}>
                    <h1>Waiting...</h1>
                </div>
            </div>
        )
    } else if (!hasReserved) {
        return (
            <div id={styles.wrapper}>
                <div id={styles.panel}>
                    <h1>Make a Reservation</h1>
                    <div id="restaurant">
                        <p><strong>{restaurant.name}</strong></p>
                        <p>{restaurant.address}</p>
                    </div>
                    {/* Date Input */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="date">Day: </label>
                        <input type="date" name="date" value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {/* Guest Count Input */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="guestCount">Guest Count: </label>
                        <select
                            name="guestCount"
                            value={guestCount}
                            onChange={(e) => setGuestCount(e.target.value)}>
                            { [...Array(8)].map((_, i) => (<option key={i} value={i+1}>{i+1}</option>)) }
                        </select>
                    </div>
                    {/* Name Input */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Name: </label>
                        <input type="text" name="name" value={name} required
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                        />
                    </div>
                    {/* Email Input */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email: </label>
                        <input type="email" name="email" value={email} required
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                        />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <p>Select a time:</p>
                        <div id={styles.times}>
                            { loading && <p>{message}</p>}
                            { !loading && availableTimes.length > 0 && 
                                availableTimes.map((availableTime) => (
                                    <button
                                        type="button"
                                        key={availableTime}
                                        onClick={() => setTime(availableTime)}
                                        className={(time == availableTime) ? styles.active : ""}
                                    >{availableTime}</button>
                                ))
                            }
                            { !loading && availableTimes.length == 0 && <p>{message}</p> }
                        </div>
                        <button id={styles.submitButton} type="submit"
                            disabled={!name || !email || !time || !date}
                            className={(!name || !email || !time || !date) ? "" : styles.active}>
                            Place Reservation
                        </button>
                    </form>
                </div>
            </div>
        );
    } else {
        return (
            <div id={styles.wrapper}>
                <ReservationInfo code={reservationCode} email={email} canDelete={true} />
            </div>
        );
    }
};