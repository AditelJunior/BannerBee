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

    const formatAIText = (response) => {
        // Regex to extract HTML code inside triple backticks
        const htmlRegex = /```html\n([\s\S]*?)```/;
        const match = response.match(htmlRegex);
      
        // Extract HTML and remove it from the response text
        const htmlPart = match ? match[1] : "";
        let textPart = response.replace(htmlRegex, "").trim();
      
        // Convert AI markdown to HTML tags
        textPart = textPart
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold (**text** → <strong>text</strong>)
          .replace(/\*(.*?)\*/g, "<em>$1</em>")             // Italic (*text* → <em>text</em>)
          .replace(/`([^`]+)`/g, "<code>$1</code>")        // Inline code (`code` → <code>code</code>)
          .replace(/\n/g, '<br>')

          textPart = textPart.replace(/(?:^|\n)\* (.*?)/g, (_, item) => `<li>${item}</li>`);

          // Wrap <li> items inside a <ul> if there are any
          if (textPart.includes("<li>")) {
            textPart = `<ul>${textPart}</ul>`;
          }
          console.log(htmlPart)

        return { text: textPart, html: htmlPart };
      };
    //   async function uploadHtml(html) {
        

    //     // Create file metadata including the content type
    //     /** @type {any} */
    //     const metadata = {
    //     contentType: 'image/jpeg',
    //     };

    //     // Upload the file and metadata
    //     const uploadTask = uploadBytes(ref(storage, 'images/mountains.jpg'), file, metadata);

    //   }
    async function aiResponse(request, documents) {
        if(documents && documents.length>0) {
            uploadImages(documents);
        }
        
        console.log(request)
        setQuery(request)
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });
        let result = '';
        try {
            result = await chat.sendMessage(request);
            console.log(result.response.text())
            setModelResult(formatAIText(result.response.text()));
            setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: request }] }, { role: "model", parts: [{ text: result.response.text() }] }]);
        } catch (error) {
            console.error("Error sending message:", error);
        }
        
    }
    function reloadHtmlPreview() {
        document.getElementById('html_preview').contentWindow.location.reload();
    }
    function fullScreeHtmlPreview() {
        if(document.getElementById('preview_wrap').classList.contains("htmlPreviewFullScreen")) {
            document.getElementById('preview_wrap').classList.remove("htmlPreviewFullScreen");
            document.querySelector('.close_preview_button').style.display = "none";
        } else {
            document.getElementById('preview_wrap').classList.add("htmlPreviewFullScreen");
            document.querySelector('.close_preview_button').style.display = "block";
        }
        
    }
  return (
    <div>
        <div className="container_home">
            <div className="left_side">
                <div className="chat_form">
                    <textarea type="text" id="chat_input"/>
                    <input type="file" multiple onChange={(e)=>setInputFiles(e.target.files)}/>
                    <button onClick={(e)=>{aiResponse(document.getElementById('chat_input').value, inputFiles)}}>Send</button>
                </div>
            </div>
            <div className="right_side">
                <p dangerouslySetInnerHTML={{ __html: modelResult.text }} >
                </p>
            </div>
        </div>
        <div className="html_showroom">
            
            <div id="preview_wrap" className="preview_wrap">
                <div className="html_preview_control">
                    <button onClick={()=>reloadHtmlPreview()}>Reload</button>
                    {
                        document.getElementById('preview_wrap').classList.contains("htmlPreviewFullScreen") ? 
                            <button className="close_preview_button" onClick={()=>fullScreeHtmlPreview()}>✕</button> :
                            <button onClick={()=>fullScreeHtmlPreview()}>Full screen</button>
                    }
                    <button>Download</button>
                </div>
                <iframe srcDoc={modelResult.html} frameBorder="0" id="html_preview"></iframe>
            </div>
            
        </div>
    </div>
    
  );
};

export default Home;