// src/api/chatbot.js
import axios from "axios";

// HTTP용 베이스 URL
export const CHATBOT_BASE_URL =
  import.meta.env.VITE_CHATBOT_URL ||
  "https://nonelicited-curably-twanda.ngrok-free.dev";

// WebSocket용 베이스 URL (https → wss 로 변경)
export const CHATBOT_WS_BASE_URL = CHATBOT_BASE_URL.replace(/^http/, "ws").replace(/\/$/, "");

// ✅ 1단계: Access Token 발급
export const getChatbotAccessToken = async ({ id, name, contact }) => {
  const res = await axios.post(`${CHATBOT_BASE_URL}/auth/token/public`, {
    id,
    name,
    contact,
  });

  // 가이드에 따라 "accesstoken" 키 사용
  return res.data?.accesstoken;
};
