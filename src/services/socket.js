import { io } from "socket.io-client";

// const socket = io("https://intercom-backend.onrender.com/");
const socket = io(import.meta.env.VITE_SOCKET_URL);

export default socket;