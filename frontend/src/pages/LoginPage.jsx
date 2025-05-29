import React from 'react';
import {useNavigate} from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import api from '../api'; // Assuming you have an api.js file for API calls

export default function LoginPage() {
    const nav = useNavigate();
    
    const handleLogin = async ({email, password}) => {
        try {
            const resp = await api.loginUser({email, password});
            // Store the token in localStorage
            localStorage.setItem('token', resp.data.token);
            nav('/lobby');
        } catch (err) {
            console.error('Login failed', err)
            alert(err.response?.data?.detail ||
            (err.response?.data ? JSON.stringify(err.response.data): err.message)    ||
                 'Login failed');
        }
    }

    return (
        <AuthForm
            title="Log In"
            fields={[
                {name: 'email', label: "Email", type: 'email'},
                {name: 'password', label: "Password", type: 'password'}
            ]}
            onSubmit={handleLogin}
            />
    );
}