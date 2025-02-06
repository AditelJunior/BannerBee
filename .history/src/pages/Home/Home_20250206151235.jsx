import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "./../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import "./styles.scss";


const  Home = () => {
    const [modelResult, setModelResult] = useState('');
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [inputFiles, setInputFiles] = useState();

    const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
            maxOutputTokens: 100,
        },
    });

    async function uploadImage(image) {
        const sessionName = 'session';
        const storageRef = ref(storage, `${sessionName}/${image.name}`);
      
        const response = await uploadBytes(storageRef, image);

        const url = await getDownloadURL(response.ref);
        return {url: url, name: image.name};
    }

    async function uploadImages(images) {
        const imagePromises = Array.from(images, (image) => uploadImage(image));

        const imageRes = await Promise.all(imagePromises);
        console.log(imageRes)
        return imageRes; // list of url like ["https://..", ...]
    }

    useEffect(() => {

    }, []);

    async function aiResponse(request, documents) {
        if(documents.length>0) {
            uploadImages(documents)
        }
        

        const result = await chat.sendMessage(request);

        setModelResult(result.response.text())
        setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: request }] }, { role: "model", parts: [{ text: result.response.text() }] }]);

    }
  return (
    <div className="container_home">
        <div className="left_side">
        <div className="messages_container">
            {
            /* {query}
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
                <input type="file" multiple onChange={(e)=>setInputFiles(e.target.files)}/>
                <button onClick={(e)=>{aiResponse(query, inputFiles)}}>Send</button>
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