'use client';
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from "react";

export default function AdminLogin() {

    const router = useRouter();
    const [loginStatus, setLoginStatus] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        setLoginStatus("Waiting...");
        event.preventDefault();
        const createUrl = process.env.NEXT_PUBLIC_FUNCTION_URL + "/LoginAdministrator";
        const formData = new FormData(event.currentTarget);
        let body = JSON.stringify({
            username: formData.get("username"), 
            password: formData.get("password")
        });
        const response = await fetch(createUrl, { method: "POST", body });
        const result = await response.json();
        if(result.statusCode == 200) {
            document.cookie = "jwt=" + result.jwt
            setLoginStatus("Login successful, redirecting...");
            router.push('/admin-dashboard');
        } else {
            setLoginStatus(result.error);
        }
    }

    return (
        <div id="login-admin-panel">
            <h1>Administrator Login</h1>
            <form onSubmit={submit} method="post">
                <div>
                    <div className="panel-input">
                        <label htmlFor="username">Username:</label>
                        <input required type="text" name="username" placeholder="Username" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="password">Password:</label>
                        <input required type="text" name="password" placeholder="Password" />
                    </div>
                </div>
                <div>
                    <input type="submit" value="Login" />
                    <br></br>
                    <a href="/owner-login">I want to login as a restaurant owner</a>
                </div>
            </form>
            <p>{loginStatus}</p>
        </div>
    );
}