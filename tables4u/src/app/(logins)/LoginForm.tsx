'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from "react";
import styles from "./LoginForm.module.css";

export default function LoginForm({
    type
}: {
    type: "admin" | "owner"
}) {
    const router = useRouter();
    const [loginStatus, setLoginStatus] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        setLoginStatus("Waiting...");
        event.preventDefault();

        // form request
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL +
            (type == "admin" ? "/LoginAdministrator" : "/LoginRestaurant");
        const formData = new FormData(event.currentTarget);
        const body = JSON.stringify({
            username: formData.get("username"),
            password: formData.get("password")
        });

        // send request and wait for response
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        // determine if login was successful
        if (result.statusCode === 200) {
            setLoginStatus("Login successful, redirecting...");
            document.cookie = "jwt=" + result.jwt
            if (type == "admin") router.push("/admin-dashboard");
            else router.push("/manage-restaurant");
        } else {
            setLoginStatus(result.error);
        }
    }

    return (
        <div id={styles.loginForm}>
            <h1>{(type == "admin") ? "Administrator Login" : "Owner Login"}</h1>
            <form onSubmit={submit} method="post">
                <div>
                    <div className={styles.panelInput}>
                        <label htmlFor="username">Username:</label>
                        <input required type="text" id="username" name="username" placeholder="Username" />
                    </div>
                    <div className={styles.panelInput}>
                        <label htmlFor="password">Password:</label>
                        <input required type="password" id="password" name="password" placeholder="Password" />
                    </div>
                </div>
                <div>
                    <p id={styles.loginStatus}>{loginStatus}</p>
                    <input type="submit" value="Log in" />
                    {type == "admin" && <a href="/owner-login">I want to login as a restaurant owner</a> }
                    {type == "owner" && <a href="/admin-login">I want to login as an administrator</a>}
                </div>
            </form>
        </div>
    )
}