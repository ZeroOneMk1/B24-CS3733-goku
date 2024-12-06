"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'

interface FilterRequestBody {
    filters: {
        name: string;
        date: string;
        time: string;
        guestCount: string;
        onlyShowAvailableRestaurants: string;
    };
}

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

const MakeReservation: React.FC = () => {
    const searchParams = useSearchParams()
    const restaurantID = searchParams.get('restaurantID');

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [restaurant, setRestaurant] = useState<{ name: string; address: string }>({ name: '', address: '' });
    const [restaurantInfo, setRestaurantInfo] = useState<GetRestaurantInfoResponse>({ restaurantInfo: { restaurantID: '', name: '', address: '', isActive: 0, openingTime: 0, closingTime: 0, credentialID: '' }, tables: [] });

    // run getAvailableTimes when date or guestCount changes
    const [guestCount, setGuestCount] = useState("1");
    const [date, setDate] = useState("");
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    async function getAvailableTimes(day: string, guestCount: number) {
        setLoading(true);
        setMessage("Getting Available Times");
        setTime('');
        console.log('Getting available times for', day, 'with', guestCount, 'guests');
        console.log('Restaurant Info:', restaurantInfo);
        const fetchRestaurantInfo = async () => {
            try {
                let openingTime = restaurantInfo.restaurantInfo.openingTime;
                let closingTime = restaurantInfo.restaurantInfo.closingTime;
                const times: string[] = [];
                for (let i = openingTime; i < closingTime; i++) {
                    const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListRestaurants", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ filters: { name: restaurant.name, date: day, time: i.toString(), guestCount: guestCount.toString(), onlyShowAvailableRestaurants: 'true' } }),
                    });
                    const data = await response.json();
                    if (data.restaurants && data.restaurants.length > 0) {
                        times.push(i.toString());
                    }
                }
                setAvailableTimes(times);
                if (times.length === 0) {
                    setMessage("No available times found");
                } else {
                    setMessage("");
                }
            } catch (error) {
                console.error('Error fetching restaurant info:', error);
                setMessage("Error fetching available times");
            } finally {
                setLoading(false);
            }
        };

        if (day && guestCount) {
            await fetchRestaurantInfo();
            console.log('Available Times:', availableTimes);
        }
    }

    useEffect(() => {
        const fetchRestaurantInfo = async () => {
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ restaurantID: restaurantID }),
                });
                const data = await response.json();
                setRestaurantInfo(JSON.parse(data.body));
                setRestaurant({ name: JSON.parse(data.body).restaurantInfo.name, address: JSON.parse(data.body).restaurantInfo.address });
            } catch (error) {
                console.error('Error fetching restaurant info:', error);
            }
        };

        if (restaurantID) {
            fetchRestaurantInfo();
        }
    }, [restaurantID]);

    useEffect(() => {
        if (date && guestCount && restaurantInfo.restaurantInfo.openingTime && restaurantInfo.restaurantInfo.closingTime) {
            getAvailableTimes(date, parseInt(guestCount));
        }
    }, [date, guestCount]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log(`Name: ${name}, Email: ${email}, Time: ${time}`);
        let payload: MakeReservationBody = {
            name: name,
            email: email,
            restaurant: restaurant.name,
            date: date,
            time: time,
            customerCount: guestCount,
        };
        console.log('Payload:', payload);
        const makeReservationSubmit = async () => {
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_FUNCTION_URL + "/MakeReservation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                console.log('Reservation Response:', data);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        

        if (restaurantID) {
            makeReservationSubmit();
            await getAvailableTimes(date, parseInt(guestCount));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h1>Make a Reservation</h1>
            {/* <p>Restaurant: {restaurantID}</p> */}
            <p><strong>{restaurant.name}</strong></p>
            <p>{restaurant.address}</p>
            <p>4 guests &middot; Monday, November 11th</p>
            {/* Date Input */}
            <div className="find-input">
                <label htmlFor="date">Day: </label>
                <input  
                    type="date" 
                    name="date" 
                    value={date} 
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
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                </select>
            </div>
            {/* Name Input */}
            <div className="find-input">
                <label htmlFor="name">Name: </label>
                <input  
                    type="text" 
                    name="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                />
            </div>
            {/* Email Input */}
            <div className="find-input">
                <label htmlFor="email">Email: </label>
                <input  
                    type="email" 
                    name="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Select a time:
                        <div>
                            {loading ? (
                                <p>{message}</p>
                            ) : (
                                availableTimes.length > 0 ? (
                                    availableTimes.map((availableTime) => (
                                        <button
                                            type="button"
                                            key={availableTime}
                                            onClick={() => setTime(availableTime)}
                                            style={{
                                                backgroundColor: time === availableTime ? 'lightblue' : 'white'
                                            }}
                                        >
                                            {availableTime}
                                        </button>
                                    ))
                                ) : (
                                    <p>{message}</p>
                                )
                            )}
                        </div>
                    </label>
                </div>
                {/* Add other form fields here */}
                <button type="submit">Reserve!</button>
            </form>
        </div>
    );
};

export default MakeReservation;