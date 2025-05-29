import React from 'react';
import {useNavigate} from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import api from '../api'; // Assuming you have an api.js file for API calls

export default function RegisterPage() {
    const nav = useNavigate();

    const handleRegister = async ({username, email, password}) => {
        try {
            await api.registerUser({username, email, password});
            //Optionally store a token if returned
            //localstorage.setItem('token', resp.data.token);
            nav('/lobby');
        } catch (err) {
            console.error('Registration failed', err)
            alert(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <AuthForm
            title="Register"
            fields={[
                {name: 'username', label: "Username"},
                {name: 'email', label: "Email", type: 'email'},
                {name: 'password', label: "Password", type: 'password'}
            ]}
            onSubmit={handleRegister}
        />
    )
}