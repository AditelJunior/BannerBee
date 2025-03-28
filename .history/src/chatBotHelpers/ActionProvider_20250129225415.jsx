import React, {useState} from 'react';
import { model } from "../gemini";

const ActionProvider = ({ createChatBotMessage, setState, children }) => {

  const [modelResult, setModelResult] = useState('');
  // const [request, setRequest] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  async function aiResponse(request) {
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
          maxOutputTokens: 100,
      },
  });

  const result = await chat.sendMessage(request);

  setModelResult(result.response.text())
  setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: request }] }, { role: "model", parts: [{ text: result.response.text() }] }]);

  const botMessage = await createChatBotMessage(result.response.text());

  await setState((prev) => ({
    ...prev,
    messages: [...prev.messages, botMessage],
  }));
}

  // const aiResponse = async (request) => {
  //   callAi(request)
    
  // } 
  

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: {
            aiResponse,
          },
        });
      })}
    </div>
  );
};

export default ActionProvider;