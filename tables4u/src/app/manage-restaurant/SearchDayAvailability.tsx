'use client';
import { useState } from 'react';

// Define reservation interface
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
    const [utilReport, setUtilReport] = useState<number | null>(null);  // State for utilReport
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Format date function
    const formatDate = (inputDate: string) => {
        const [year, month, day] = inputDate.split('-');
        return `${month}-${day}-${year}`;
    };

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        setLoading(true);
        setError('');
        event.preventDefault();


        setReservations([]);
        setUtilReport(null);

        const apiEndpoint = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ReviewDaysAvailability";


        const jwt = document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2);

        if (!jwt) {
            setError('JWT is missing');
            setLoading(false);
            return;
        }

        
        const formattedDate = formatDate(date);

        const body = JSON.stringify({ date: formattedDate, jwt });

        try {
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
                setUtilReport(result.response.utilReport);  
            } else {
                setError('No reservations found for this date');
            }
        } catch (err) {
            setError('Error occurred');
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

            {/* utilreport */}
            {utilReport !== null && (
                <p>Utilization Report: {(utilReport * 100)}%</p>
            )}

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
