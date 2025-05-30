import axios from 'axios';

const API_BASE = 'http://drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com';
console.log("API_BASE:", API_BASE);
const api = axios.create({ 
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const registerUser = data => api.post('/users/', data);
const loginUser = data => api.post('/users/login', data);

const fetchRooms = () => api.get('/rooms/');
const createRoom = data => api.post('/rooms/', data);

const fetchRounds = room_id => api.get('/rounds/', { params: { room_id } });
const createRound = data => api.post('/rounds/', data);

const fetchDrawings = round_id => api.get('/drawings/', { params: { round_id } });
const createDrawing = data => api.post('/drawings/', data);

const fetchMessages = room_id => api.get('/chat/', { params: { room_id } });
const postMessage = data => api.post('/chat/', data);

const fetchVotes = drawing_id => api.get('/votes/', { params: { drawing_id } });
const postVote = data => api.post('/votes/', data);

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