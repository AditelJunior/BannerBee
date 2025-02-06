import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "./../../firebase";

import "./styles.scss";


const  Home = () => {
    const [modelResult, setModelResult] = useState('');
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    console.log(storage)

    useEffect(() => {
        console.log('hello')
    }, []);

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
        console.log(chatHistory)
    }
  return (
    <div className="container_home">
        <div className="left_side">
        <div className="messages_container">
            {/* {query}
            {
                chatHistory.length > 0 && chatHistory.map((message, id)=> {
                    return (
                        <div key={id} className={message.role === 'user' ? 'message user_message' : 'message model_message'}>
                            <span>{message.parts[0].text}</span>
                        </div>
                    )
                })
            } */}
        </div>
            <div className="chat_form">
                <textarea type="text" id="chat_input" onChange={(e)=>setQuery(e.target.value)}/>
                <input type="file" />
                <button onClick={(e)=>{aiResponse(query)}}>Send</button>
            </div>
        </div>
        <div className="right_side">
            <p>
                {
                    modelResult
                }
            </p>
        </div>
    </div>
  );
};

export default Home;