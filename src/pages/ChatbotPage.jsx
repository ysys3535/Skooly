// src/pages/ChatbotPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ✅ 챗봇 서버 HTTP / WS 주소 설정
const CHATBOT_HTTP_BASE_URL = (
  import.meta.env.VITE_CHATBOT_URL ||
  "https://nonelicited-curably-twanda.ngrok-free.dev"
).replace(/\/$/, "");

const CHATBOT_WS_BASE_URL = CHATBOT_HTTP_BASE_URL.replace(/^http/, "ws");

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const messagesEndRef = useRef(null);

  // ✅ WebSocket / 토큰 보관용
  const wsRef = useRef(null);
  const tokenRef = useRef(null);

  // 🔹 스크롤 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 언마운트 시 WebSocket 정리
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 🔹 로그인/로컬 저장 정보에서 사용자 식별 값 가져오기
  const memberId = localStorage.getItem("memberId") || null;
  const name = localStorage.getItem("name") || "게스트";
  const contact =
    localStorage.getItem("username") ||
    localStorage.getItem("email") ||
    "";

  // 로그인 여부 체크 + 리다이렉트
  useEffect(() => {
    const loggedIn = Boolean(memberId);
    setIsLoggedIn(loggedIn);
    if (!loggedIn) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      navigate("/login");
    }
  }, [memberId, navigate]);

  // 🔍 응답 객체 안에서 token 관련 문자열을 재귀적으로 찾는 함수
  const findTokenInObject = (obj) => {
    if (!obj || typeof obj !== "object") return null;

    for (const [key, value] of Object.entries(obj)) {
      // 키 이름에 token 이 포함되어 있고 값이 문자열이면 토큰으로 사용
      if (typeof value === "string" && /token/i.test(key)) {
        return value;
      }
      // 중첩 객체도 탐색
      if (value && typeof value === "object") {
        const nested = findTokenInObject(value);
        if (nested) return nested;
      }
    }
    return null;
  };

  // ✅ 1단계: Access Token 발급
  const fetchAccessToken = async () => {
    if (tokenRef.current) return tokenRef.current;

    const res = await fetch(`${CHATBOT_HTTP_BASE_URL}/auth/token/public`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: memberId,
        name,
        contact,
      }),
    });

    if (!res.ok) {
      throw new Error(`토큰 발급 실패 (${res.status})`);
    }

    const rawText = await res.text();
    console.log("🔍 토큰 응답 RAW:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }
    console.log("🔍 토큰 응답 JSON:", data);

    const token = findTokenInObject(data);

    if (!token) {
      throw new Error(
        "토큰 추출 실패: 서버 응답 안에서 token 관련 값을 찾지 못했습니다. 콘솔의 🔍 로그를 캡처해서 백엔드에 보여 주세요."
      );
    }

    tokenRef.current = token;
    return token;
  };

  // ✅ 2단계: WebSocket 연결 (없으면 열고, 있으면 재사용)
  const ensureWebSocketConnected = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const token = await fetchAccessToken();

    return await new Promise((resolve, reject) => {
      const ws = new WebSocket(
        `${CHATBOT_WS_BASE_URL}/chat/ws?token=${encodeURIComponent(token)}`
      );

      ws.onopen = () => {
        console.log("✅ WebSocket Connected");
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const replyText =
            data.reply || data.message || data.text || JSON.stringify(data);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              sender: "bot",
              text:
                replyText ||
                "답변을 받아오지 못했어요. 잠시 후 다시 시도해 주세요 🥲",
            },
          ]);
        } catch (e) {
          console.error("메시지 파싱 오류:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("웹소켓 에러:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            sender: "bot",
            text:
              "죄송합니다. 서버와 통신 중 오류가 발생했어요 🥲\n잠시 후 다시 시도해 주세요.",
          },
        ]);
        reject(err);
      };

      ws.onclose = () => {
        console.log("WebSocket Closed");
        wsRef.current = null;
      };
    });
  };

  // ✅ 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const myMessage = {
      id: Date.now(),
      sender: "me",
      text: trimmed,
    };

    // 내 메시지 먼저 화면에 추가
    setMessages((prev) => [...prev, myMessage]);
    setInput("");
    setIsSending(true);

    try {
      const ws = await ensureWebSocketConnected();

      // 가이드 예시: { text: "..." } 형식으로 전송
      ws.send(JSON.stringify({ text: trimmed }));
    } catch (error) {
      console.error("챗봇 요청 실패:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text:
            "죄송합니다. 서버와 통신 중 오류가 발생했어요 🥲\n잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (text) => {
    setInput(text);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-4 py-4 md:py-6">
      <h1 className="mb-2 text-lg font-semibold md:text-xl">챗봇</h1>
      <p className="mb-4 text-xs text-gray-500 md:text-sm">
        운동하고 싶을 때, 챗봇이 도와드릴게요 😊
      </p>

      <div className="flex flex-1 flex-col rounded-2xl bg-white p-4 shadow-sm min-h-[60vh]">
        {/* 채팅 영역 */}
        <div className="mb-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs md:text-sm ${
                  msg.sender === "me"
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-gray-900"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 빠른 질문 버튼들 */}
        <div className="mb-2 flex flex-wrap gap-2 text-[12px] md:text-xs">
          <button
            type="button"
            onClick={() =>
              handleQuickQuestion("서울에서 농구할 수 있는 학교 추천해줘")
            }
            className="rounded-full bg-blue-100 px-3 py-1.5 font-bold text-gray-700 hover:bg-blue-200"
          >
            서울 농구 가능한 학교
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickQuestion("나에게 맞는 동호회를 추천해줘")
            }
            className="rounded-full bg-blue-100 px-3 py-1.5 font-bold text-gray-700 hover:bg-blue-200"
          >
            동호회
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickQuestion("무료로 이용 가능한 시설도 있어?")
            }
            className="rounded-full bg-blue-100 px-3 py-1.5 font-bold text-gray-700 hover:bg-blue-200"
          >
            무료 이용 가능 시설
          </button>
        </div>

        {/* 입력창 */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 서울, 농구, 토요일 저녁에 사용할 수 있는 학교 알려줘"
            className="flex-1 border-none bg-transparent px-2 py-1 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={isSending}
            className="flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-colors p-2 shadow-sm disabled:opacity-60"
            aria-label="메시지 보내기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 21 24"
              strokeWidth={2}
              stroke="white"
              className="w-6 h-6 rotate-45"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

