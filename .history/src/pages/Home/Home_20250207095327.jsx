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
    const [fileInputsCount, setFileInputsCount] = useState(1);
    const [htmlPreviewFull, setHtmlPreviewFull] = useState(false);

   
    async function uploadImage(file) {
        const sessionName = 'session';
        const storageRef = ref(storage, `${sessionName}/${file.name}`);
      
        const response = await uploadBytes(storageRef, file);
        console.log(file)
        const url = await getDownloadURL(response.ref);

        const newImage = new Image();
        newImage.onload = function() {
          console.log(this.width, this.height);
        }
        newImage.src = URL.createObjectURL(file);

        return {url: url, name: file.name};
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
    
    async function aiResponse(request) {
        const fileInputs = document.querySelector('.inputs_list').querySelectorAll('[type="file"]')
        console.log(fileInputs)
        let filesArr = [];
        for(let i=0;i<fileInputs.length;i++) {
            filesArr.push(fileInputs[i].files[0])
        }
        console.log(filesArr)
        if(filesArr && filesArr.length>0) {
            uploadImages(filesArr);
        }
        
        // console.log(request)
        // setQuery(request)
        // const chat = model.startChat({
        //     history: chatHistory,
        //     generationConfig: {
        //         maxOutputTokens: 2000,
        //     },
        // });
        // let result = '';
        // try {
        //     result = await chat.sendMessage(request);
        //     console.log(result.response.text())
        //     setModelResult(formatAIText(result.response.text()));
        //     setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: request }] }, { role: "model", parts: [{ text: result.response.text() }] }]);
        // } catch (error) {
        //     console.error("Error sending message:", error);
        // }
        
    }
    function reloadHtmlPreview() {
        document.getElementById('html_preview').contentWindow.location.reload();
    }
    function fullScreeHtmlPreview() {
        if(htmlPreviewFull) {
            document.getElementById('preview_wrap').classList.remove("html_preview_full_screen_active");
            setHtmlPreviewFull(false)
        } else {
            document.getElementById('preview_wrap').classList.add("html_preview_full_screen_active");
            setHtmlPreviewFull(true)
        }
        
    }
  return (
    <div>
        <div className="container_home">
            <div className="left_side">
                <div className="chat_form">
                    <textarea type="text" id="chat_input" placeholder="Enter your request"/>
                    <input type="file" multiple onChange={(e)=>setInputFiles(e.target.files)}/>
                    <button onClick={()=>{setFileInputsCount(fileInputsCount+1)}} disabled={fileInputsCount < 10 ? false : true}>Add Inputs</button>
                    <div className="inputs_list">
                        {
                            [...Array(fileInputsCount)].map((el, i)=> {
                                return (
                                    <div className="inputs_row" key={'inputRow'+i}>
                                        <div>
                                            {/* <label htmlFor={'fileInput-' + i}></label> */}
                                            <input type="file" id={'fileInput-' + i}/>
                                        </div>
                                        
                                        <div>
                                            {/* <label htmlFor={'fileDesc-' + i}>File description: </label> */}
                                            <input type="text" id={'fileDesc-' + i} placeholder="File desctiption" className="file_description"/>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <button onClick={(e)=>{aiResponse(document.getElementById('chat_input').value)}}>Send</button>
                </div>
            </div>
            <div className="right_side">
                <p dangerouslySetInnerHTML={{ __html: modelResult.text }} >
                </p>
            </div>
        </div>
        <div className="html_showroom">
            {
                modelResult.html ? 
                <div id="preview_wrap" className="preview_wrap">
                    <div className="html_preview_control">
                        <button onClick={()=>reloadHtmlPreview()}>Reload</button>
                        <button>Download</button>
                        {
                            htmlPreviewFull ? 
                            <button className="close_preview_button" onClick={()=>fullScreeHtmlPreview()}>Smaller screen</button> :
                            <button onClick={()=>fullScreeHtmlPreview()}>Full screen</button>
                        }
                    </div>
                
                    <iframe srcDoc={modelResult.html} frameBorder="0" onload="this.style.height=(this.contentDocument.body.scrollHeight + 15) + 'px';'" id="html_preview"></iframe> 
                    
                </div> : <span>HTML is not generated</span>
            }
            
        </div>
    </div>
    
  );
};

export default Home;