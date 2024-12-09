"use client";

import React, { useEffect, useState } from 'react';

import ReservationInfo from '../(reservations)/ReservationInfo';

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

export default function MakeReservation({ searchParams }: { searchParams: { restaurantID: string}}) {
    const restaurantID = searchParams.restaurantID;

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [restaurant, setRestaurant] = useState<{ name: string; address: string }>({ name: '', address: '' });
    const [restaurantInfo, setRestaurantInfo] = useState<GetRestaurantInfoResponse | null>(null);

    // run getAvailableTimes when date or guestCount changes
    const [guestCount, setGuestCount] = useState("1");
    const [date, setDate] = useState("");
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [reservationCode, setReservationCode] = useState<number>(0);

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
        for (let i = openingTime; i < closingTime; i++) {
            const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListRestaurants", {
                method: "POST",
                body: JSON.stringify({ filters: { name: restaurant.name, date: day, time: i.toString(),
                    guestCount: guestCount.toString(), onlyShowAvailableRestaurants: 'true' } }),
            });

            const data = await response.json();
            if (data.restaurants && data.restaurants.length > 0) times.push(i.toString());
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
    }, [date, guestCount]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
    
        // Validate email
        const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address");
            return;
        }
    
        // get submit button by ID
        // disable it
        const submitButton = document.getElementById("SubmitButton"); // oh my GOD don't do this
        if (submitButton) submitButton.setAttribute("disabled", "true");
    
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

    if (!hasReserved) {
        return (
            <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '10px' }}>
                <h1>Make a Reservation</h1>
                {/* <p>Restaurant: {restaurantID}</p> */}
                <p><strong>{restaurant.name}</strong></p>
                <p>{restaurant.address}</p>
                <p>{guestCount} guest{parseInt(guestCount) > 1 ? "s" : ""} &middot; Monday, November 11th</p>
                {/* Date Input */}
                <div className="find-input">
                    <label htmlFor="date">Day: </label>
                    <input type="date" name="date" value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                {/* Guest Count Input */}
                <div className="find-input">
                    <label htmlFor="guestCount">Guest Count: </label>
                    <select
                        name="guestCount"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}>
                        { [...Array(8)].map((_, i) => (<option key={i} value={i+1}>{i+1}</option>)) }
                    </select>
                </div>
                {/* Name Input */}
                <div className="find-input">
                    <label htmlFor="name">Name: </label>
                    <input type="text" name="name" value={name} required
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                {/* Email Input */}
                <div className="find-input">
                    <label htmlFor="email">Email: </label>
                    <input type="email" name="email" value={email} required
                        onChange={(e) => setEmail(e.target.value)}
                        title="Please enter a valid email address"
                    />
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <p>Select a time:</p>
                        <div>
                            { loading && <p>{message}</p>}
                            { !loading && availableTimes.length > 0 && 
                                availableTimes.map((availableTime) => (
                                    <button
                                        type="button"
                                        key={availableTime}
                                        onClick={() => setTime(availableTime)}
                                        style={{
                                            backgroundColor: time === availableTime ? 'lightblue' : 'white'
                                        }}
                                    >{availableTime}</button>
                                ))
                            }
                            { !loading && availableTimes.length == 0 && <p>{message}</p> }
                        </div>
                    </div>
                    {/* Add other form fields here */}
                    <button id="SubmitButton" type="submit"
                        disabled={!name || !email || !time || !date}
                        style={{ backgroundColor: (!name || !email || !time || !date) ? 'grey' : 'orange' }}>
                        Reserve
                    </button>
                </form>
            </div>
        );
    } else {
        return (
            <ReservationInfo code={reservationCode} email={email} canDelete={true} />
        );
    }
};