// Import Axios
// • Rol: Bibliotecă HTTP pentru efectuarea cererilor către API.
import axios from 'axios';

// Obține URL-ul de bază al API-ului din meta tag
// • Rol: Permite configurarea dinamică a endpoint-ului API la runtime.
const meta = document.querySelector('meta[name="api-base-url"]');

// Setează baza URL-ului API
// • Rol: Folosește valoarea din meta sau fallback la "/" dacă nu există.
const API_BASE = meta?.content || '/';

// Instanță Axios
// • Rol: Creează un client Axios cu baseURL și antete implicite JSON.
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor Request
// • Rol: Atașează token-ul de autentificare (Bearer) la fiecare cerere, dacă există.
api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Endpoint: POST /users/
// • Rol: Înregistrează un nou utilizator.
const registerUser = data => api.post('/users/', data);

// Endpoint: POST /users/login
// • Rol: Autentifică un utilizator și returnează token.
const loginUser = data => api.post('/users/login', data);

// Endpoint: GET /rooms/
// • Rol: Obține lista de camere disponibile.
const fetchRooms = () => api.get('/rooms/');

// Endpoint: POST /rooms/
// • Rol: Creează o nouă cameră de joc.
const createRoom = data => api.post('/rooms/', data);

// Endpoint: GET /rounds/
// • Rol: Obține rundele pentru o cameră dată.
const fetchRounds = room_id => api.get('/rounds/', { params: { room_id } });

// Endpoint: POST /rounds/
// • Rol: Creează o rundă nouă într-o cameră.
const createRound = data => api.post('/rounds/', data);

// Endpoint: GET /drawings/
// • Rol: Obține desenele legate de o rundă specifică.
const fetchDrawings = round_id => api.get('/drawings/', { params: { round_id } });

// Endpoint: POST /drawings/
// • Rol: Trimite desenul realizat de utilizator.
const createDrawing = data => api.post('/drawings/', data);

// Endpoint: GET /chat/
// • Rol: Primește mesajele de chat dintr-o cameră.
const fetchMessages = room_id => api.get('/chat/', { params: { room_id } });

// Endpoint: POST /chat/
// • Rol: Trimite un mesaj nou în chat.
const postMessage = data => api.post('/chat/', data);

// Endpoint: GET /votes/
// • Rol: Obține voturile pentru un desen specific.
const fetchVotes = drawing_id => api.get('/votes/', { params: { drawing_id } });

// Endpoint: POST /votes/
// • Rol: Trimite un vot pentru un desen.
const postVote = data => api.post('/votes/', data);

// Export API
// • Rol: Expune instanța Axios și funcțiile API pentru utilizare în restul aplicației.
export default {
    ...api,
    registerUser,
    loginUser,
    fetchRooms,
    createRoom,
    fetchRounds,
    createRound,
    fetchDrawings,
    createDrawing,
    fetchMessages,
    postMessage,
    fetchVotes,
    postVote
}