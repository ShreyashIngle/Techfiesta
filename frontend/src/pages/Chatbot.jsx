import React, { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audio, setAudio] = useState(null);

  const handleTextSubmit = async () => {
    if (!userInput.trim()) return;

    const updatedHistory = [...chatHistory, { role: "user", content: userInput }];
    setUserInput("");

    try {
      // Send request to chatbot API
      const response = await axios.post("http://127.0.0.1:8000/chatbot/chat", {
        conversation: updatedHistory,
      });

      const chatbotReply = response.data.response;
      const newHistory = [...updatedHistory, { role: "bot", content: chatbotReply }];
      setChatHistory(newHistory);

      // Play the response as speech
      playSpeech(chatbotReply);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const playSpeech = async (text) => {
    try {
      setIsSpeaking(true);
      
      // Fetch speech audio
      const audioResponse = await axios.post(
        "http://127.0.0.1:8000/chatbot/text-to-speech",
        { text },
        { responseType: "blob" }
      );

      const audioUrl = URL.createObjectURL(audioResponse.data);
      const audioElement = new Audio(audioUrl);
      setAudio(audioElement);
      
      audioElement.play();
      audioElement.onended = () => {
        setIsSpeaking(false);
      };
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audio) {
      audio.pause();
      setIsSpeaking(false);
    }
  };

  const handleAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.wav");

        try {
          // Send audio for transcription
          const transcriptionResponse = await axios.post(
            "http://127.0.0.1:8000/chatbot/speech-to-text",
            formData
          );
          const transcribedText = transcriptionResponse.data.transcription;

          // Use transcribed text as chatbot input
          const updatedHistory = [...chatHistory, { role: "user", content: transcribedText }];
          const chatbotResponse = await axios.post(
            "http://127.0.0.1:8000/chatbot/chat",
            { conversation: updatedHistory }
          );

          const chatbotReply = chatbotResponse.data.response;
          const newHistory = [...updatedHistory, { role: "bot", content: chatbotReply }];
          setChatHistory(newHistory);

          // Play chatbot response as speech
          playSpeech(chatbotReply);
        } catch (error) {
          console.error("Error:", error);
        }
      };

      setIsRecording(true);
      mediaRecorder.start();

      // Stop recording after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 5000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] bg-[#0D1B1E] text-white">
      {/* Header */}
      <header className="max-w-3xl mx-auto py-4 text-center text-2xl font-bold text-green-400 shadow-md bg-[#0B2027]">
        Chatbot Assistant
      </header>

      {/* Chat Section */}
      <main className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 border border-green-700 rounded-lg bg-[#0B2027] shadow-lg">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`p-3 rounded-xl shadow-md max-w-2xl ${
                  message.role === "user"
                    ? "bg-[#1B4D3E] text-white"
                    : "bg-[#162C2A] text-gray-300"
                }`}
                style={{ whiteSpace: "pre-line" }}
              >
                {message.content}
              </span>
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-3 border border-green-700 rounded-lg bg-[#0D1B1E] text-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleTextSubmit}
            className="bg-green-600 text-white py-2 px-5 rounded-lg hover:bg-green-500 transition"
          >
            Send
          </button>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {/* Audio Recording Button */}
          <button
            onClick={handleAudioRecording}
            disabled={isRecording}
            className={`py-2 px-6 rounded-lg transition ${
              isRecording
                ? "bg-gray-800 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-400"
            }`}
          >
            {isRecording ? "Recording..." : "Start Recording"}
          </button>

          {/* Stop Speaking Button */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="bg-yellow-500 text-white py-2 px-6 rounded-lg hover:bg-yellow-400 transition"
            >
              Stop Speaking
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
