'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from "react";

export default function AdminLogin() {
    const router = useRouter();
    const [loginStatus, setLoginStatus] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        setLoginStatus("Waiting...");
        event.preventDefault();

        // form request
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/LoginAdministrator"
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
            router.push('/manage');
        } else {
            setLoginStatus(result.error);
        }
    }

    return (
        <div className="admin-login-panel">
            <h1>Administrator Login</h1>
            <form onSubmit={submit} method="post">
                <div>
                    <div className="panel-input">
                        <label htmlFor="username">Username:</label>
                        <input required type="text" name="username" placeholder="Username" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="password">Password:</label>
                        <input required type="password" name="password" placeholder="Password" />
                    </div>
                </div>
                <div>
                    <p>{loginStatus}</p>
                    <input type="submit" value="Log in" />
                    <a href="/manage">I already have a restaurant</a>
                </div>
            </form>
        </div>
    )
}