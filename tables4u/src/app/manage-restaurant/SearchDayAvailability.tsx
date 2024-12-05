'use client';
import { useState } from 'react';
import Cookies from 'js-cookie';

//define reservation
interface Reservation {
    email: string;
    time: string;
    customerCount: string;
    confirmationCode: string;
    tableNumber: string;
}

export default function ReservationForm() {
    const [date, setDate] = useState('');
    const [reservations, setReservations] = useState<Reservation[]>([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    //format date
    const formatDate = (inputDate: string) => {
        const [year, month, day] = inputDate.split('-');
        return `${month}-${day}-${year}`; 
    };

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        setLoading(true);
        setError('');
        event.preventDefault();

        //clear past reservations
        setReservations([]);

        const apiEndpoint = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ReviewDaysAvailability";
        
        //get jwt
        const jwt = Cookies.get('jwt');
        
        if (!jwt) {
            setError('JWT is missing');
            setLoading(false);
            return;
        }

        //format date
        const formattedDate = formatDate(date);

        const body = JSON.stringify({ date: formattedDate, jwt });

        try {
            //POST
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 
                },
                body,
            });

            const result = await response.json();

            if (response.ok) {
                setReservations(result.response.reservations);
            } else {
                setError('No reservations found for this date');
            }
        } catch (err) {
            setError('Error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>Review Availability</h1>
            <form onSubmit={submit}>
                <label htmlFor="date">Select Date:</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <input
                    type="submit"
                    value={loading ? 'Loading...' : 'Refresh'}
                    disabled={loading}
                />
            </form>

            {error && <p>{error}</p>}
            {loading && <p>Loading...</p>}

            {/* reservations */}
            <ul>
                {reservations.map((reservation, index) => (
                    <li key={index}>
                        <p>Email: {reservation.email}</p>
                        <p>Time: {reservation.time}</p>
                        <p>Table Number: {reservation.tableNumber}</p>
                        <p>Guest Count: {reservation.customerCount}</p>
                        <p>Confirmation Code: {reservation.confirmationCode}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
