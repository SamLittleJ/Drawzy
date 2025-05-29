import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to Drawzy</h1>
            <p>Login into your account or create a new one to start drawing and guessing!</p>
            <div style={{margin: '20px'}}>
                <Link to="/login" style={{ marginRight: '10px', textDecoration: 'none', color: 'blue' }}>Login</Link>
                <Link to="/register" style={{ textDecoration: 'none', color: 'blue' }}>Register</Link>
            </div>
        </div>
    );
}

import HomePage from './pages/HomePage';

<Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
</Routes>