'use client';
import { useRouter } from 'next/navigation';
import ReservationInfo from '../ReservationInfo';
import { FormEvent } from 'react';
import styles from './page.module.css';

export default function FindReservation({
    searchParams
}: {
    searchParams: { code?: string, email?: string}
}) {
    const router = useRouter();

    // grab query params
    const code = Number(searchParams.code);
    const email = searchParams.email;
    const validCode = code && !isNaN(code);

    // populate URL query parameters upon form submit
    function findReservation(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        // grab form data
        const enteredEmail = formData.get("email");
        const enteredCode = Number(formData.get("code"));
        if (!enteredEmail || !enteredCode || isNaN(enteredCode)) return;

        // construct URL parameters
        const params = new URLSearchParams(searchParams);
        params.set("email", enteredEmail.toString());
        params.set("code", enteredCode.toString());
        const queryString = params.toString();

        router.push("/find-reservation?" + queryString);
    }

    // render the reservation info if valid, and the find reservation page if not
    if (validCode && email) { return (
        <ReservationInfo code={code} email={email} canDelete={true} />
    )} else  { return (
        <div id={styles.wrapper}>
            <div id={styles.findReservation}>
                <h1>Find Reservation</h1>
                <form onSubmit={findReservation}>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input required id="email" name="email" type="text" placeholder="Email"/>
                        <label htmlFor="code">Confirmation Code</label>
                        <input required id="code" name="code" type="text" placeholder="Confirmation Code"/>
                    </div>
                    <input type="submit" value="Find Reservation" />
                </form>
            </div>
        </div>
    )}
}