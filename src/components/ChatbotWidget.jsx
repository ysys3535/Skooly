// src/components/ChatbotWidget.jsx
import { useState, useRef, useEffect } from "react";

export default function ChatbotWidget({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "안녕하세요! 학교 체육시설 예약 안내 챗봇입니다 🙂",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newUserMsg = {
      id: Date.now(),
      sender: "user",
      text: input,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");

    // TODO: 여기서 실제 챗봇 서버로 요청 보내기 (기존 ChatbotPage 로직 재사용)
    // 예: await axios.post(CHATBOT_BASE_URL + "/chat", ...)
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[320px] max-h-[480px] rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-xs font-semibold text-slate-800">
            Skooly 챗봇
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 text-xs space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              {msg.text.split("\n").map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-slate-200 px-3 py-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="학교명, 지역, 시설을 입력해 주세요."
        />
        <button
          type="submit"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm hover:bg-blue-600"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
