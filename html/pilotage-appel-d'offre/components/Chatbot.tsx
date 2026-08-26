
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createChatSession, sendMessageToChat } from '../services/geminiService';
import { ChatMessage, TenderChatSession } from '../types';
import Spinner from './Spinner';

interface ChatbotProps {
  combinedPdfText: string | null;
  globalIsLoading: boolean; // From App.tsx, indicates if initial PDF processing is still ongoing
}

const Chatbot: React.FC<ChatbotProps> = ({ combinedPdfText, globalIsLoading }) => {
  const [chat, setChat] = useState<TenderChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session when combinedPdfText is available
  useEffect(() => {
    const initChat = async () => {
      if (combinedPdfText && !chat) {
        try {
          const newChat = await createChatSession(combinedPdfText);
          setChat(newChat);
          setError(null);
        } catch (err: any) {
          console.error('Error initializing chat session:', err);
          setError(`Erreur lors de l'initialisation du chatbot: ${err.message || 'Unknown error'}`);
        }
      }
    };
    initChat();
  }, [combinedPdfText, chat]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !chat || isSendingMessage) return;

    const userMessage: ChatMessage = { sender: 'user', text: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsSendingMessage(true);
    setError(null);

    try {
      const modelResponse: ChatMessage = { sender: 'model', text: '', isStreaming: true };
      setMessages((prevMessages) => [...prevMessages, modelResponse]);

      const fullText = await sendMessageToChat(chat, userMessage.text);
      setMessages((prevMessages) =>
        prevMessages.map((msg, index) =>
          index === prevMessages.length - 1 ? { ...msg, text: fullText, isStreaming: false } : msg
        )
      );
    } catch (err: any) {
      console.error('Error sending message to chatbot:', err);
      setError(`Erreur lors de l'envoi du message : ${err.message || 'Unknown error'}`);
      setMessages((prevMessages) =>
        prevMessages.map((msg, index) =>
          index === prevMessages.length - 1 ? { ...msg, text: 'Erreur: Impossible de récupérer la réponse.', isStreaming: false } : msg
        )
      );
    } finally {
      setIsSendingMessage(false);
    }
  }, [inputMessage, chat, isSendingMessage]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setChat(null); // Force re-initialization of chat session
    setError(null);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-4xl font-extrabold text-[#002D62] mb-8 text-center">
        Chatbot - Assistant Appel d'Offre
      </h2>

      {!combinedPdfText && !globalIsLoading && (
        <div className="text-center p-8 text-2xl text-gray-500">
          Uploadez des fichiers PDF sur la page d'accueil pour activer le chatbot.
        </div>
      )}

      {globalIsLoading && (
        <div className="text-center p-8 text-2xl text-[#002D62] font-semibold">
          Chargement des documents...
          <Spinner />
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-800 rounded-md shadow-sm">
          {error}
        </div>
      )}

      {combinedPdfText && (
        <>
          <div className="flex-grow overflow-y-auto border border-gray-200 p-4 rounded-lg bg-gray-50 mb-6 custom-scrollbar shadow-inner">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 italic p-4">
                Posez une question sur le contenu des documents téléchargés pour commencer la conversation.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-md text-lg
                      ${msg.sender === 'user'
                        ? 'bg-[#002D62] text-white rounded-bl-xl rounded-tr-xl rounded-tl-xl' // Dalkia Dark Blue for user
                        : 'bg-gray-200 text-gray-800 rounded-br-xl rounded-tl-xl rounded-tr-xl'
                      }`}
                  >
                    {msg.text}
                    {msg.isStreaming && (
                      <span className="ml-2 inline-block">
                        <Spinner />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
            <input
              type="text"
              className="flex-grow p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002D62] text-lg shadow-sm bg-white"
              placeholder="Posez votre question ici..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!chat || isSendingMessage}
              aria-label="Champ de saisie du message pour le chatbot"
            />
            <button
              type="submit"
              className={`px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg
                ${
                  !chat || isSendingMessage || !inputMessage.trim()
                    ? 'bg-gradient-to-r from-gray-400 to-gray-600 cursor-not-allowed opacity-70' // Greyed out when disabled
                    : 'bg-gradient-to-r from-[#002D62] to-[#F06A00] hover:from-[#F06A00] hover:to-[#002D62] focus:outline-none focus:ring-4 focus:ring-blue-300' // Dalkia gradient
                }`}
              disabled={!chat || isSendingMessage || !inputMessage.trim()}
              aria-label="Envoyer le message"
            >
              {isSendingMessage ? <Spinner /> : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Envoyer</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              className="px-6 py-4 bg-[#F06A00] text-white rounded-xl font-bold hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-lg transition-all duration-300"
              disabled={isSendingMessage}
              aria-label="Effacer la conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chatbot;
