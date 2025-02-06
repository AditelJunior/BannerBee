import React, {useState, useEffect} from "react";
import { model } from "../../gemini";
import "./styles.scss";

import Chatbot from 'react-chatbot-kit';
import config from "../../chatBotHelpers/config";
import ActionProvider from "../../chatBotHelpers/ActionProvider";
import MessageParser from "../../chatBotHelpers/MessageParser";
import 'react-chatbot-kit/build/main.css';


const  Home = () => {
    const [modelResult, setModelResult] = useState('');
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    useEffect(() => {

    }, []);

    async function aiResponse(request, e) {
        e.preventDefault();
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 100,
            },
        });

        const result = await chat.sendMessage(request);

        setModelResult(result.response.text())
        setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: request }] }, { role: "model", parts: [{ text: result.response.text() }] }]);
        console.log(chatHistory)
    }
// const result = model.generateContent(prompt);
// const validateInput = (msg) => {
//     if (msg.trim().length > 0) {
//         return true
//     } else {
//         return false
//     }
// }
  return (
    <div>
        <div className="left_side">
        {/* <Chatbot
            headerText='Chat Bot'
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
            validator={(msg) => validateInput(msg)}
        /> */}
        <div className="messages_container">
            
            {
                chatHistory.map((message, id)=> {
                    console.log(message)
                    return (
                        <div key={id} className={message.role === 'user' ? 'message user_message' : 'message message_model'}>
                            <span>{message.parts[0].text}</span>
                        </div>
                    )
                })
                // JSON.stringify(chatHistory)
                
            }
        </div>
            <div className="chat_form">
                <textarea type="text" id="chat_input" onChange={(e)=>setQuery(e.target.value)}/>
                <input type="file" />
                <button onClick={(e)=>{aiResponse(query, e)}}>Send</button>
            </div>
        </div>
        <div className="right_side">

        </div>
    </div>
  );
};

export default Home;