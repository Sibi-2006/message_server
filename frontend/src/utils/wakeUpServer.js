import axios from 'axios';
import { SERVER_URL } from '../services/api'; // Or wherever the server url is defined

export const wakeUpServer = async () => {
  try {
    // Ping the root route that we verified requires no DB
    console.log("Pinging server to wake up...");
    // 60-second timeout for the initial cold start ping
    const response = await axios.get(`${SERVER_URL}/`, { timeout: 60000 });
    console.log("Server is awake:", response.data);
    return true;
  } catch (error) {
    console.warn("Failed to wake up server or timed out:", error.message);
    return false;
  }
};
