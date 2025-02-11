import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "./../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import FileSaver, {saveAs} from "file-saver";

import MyImg from './../../images/me.jpeg';
import BeeImg from './../../images/bee.jpg';
import BinImg from './../../images/bin.png';
import EyeImg from './../../images/eye.png';
import HoneyBeeImg from './../../images/honeybee.png';
import "./styles.scss";

const Chat = () => {
    const [modelResult, setModelResult] = useState({});
    const [queryText, setQueryText] = useState('');
    // const [chatMessages, setChatMessages] = useState([]);
    const [inputFiles, setInputFiles] = useState([]);
    // const [fileInputsCount, setFileInputsCount] = useState(1);
    const [htmlPreviewFull, setHtmlPreviewFull] = useState(false);
    const [allUploadedFiles, setAllUploadedFiles] = useState([]);
    const [allUsedFiles, setAllUsedFiles] = useState([]);
    const [inputsModalOpen, setInputsModalOpen] = useState(false);
    const [iframeSize, setIframeSize] = useState({})
    const [disableSending, setDisableSending] = useState(false)
    const [chatHistory, setChatHistory] = useState([
        { 
            role: "user", 
            parts: [{ text: "Hello!"}] 
        },
        { 
            role: "model", 
            parts: [{ text: "Hello! My name is BannerBee. I create animated banners tailored to your needs. Please provide the banner <strong>SIZE (Width X Height)</strong> and any specific instructions for the animation,  and any images you'd like me to include. I'm here to bring your vision to life!"}] 
        },
    ]);

    // GEMINI CHAT
    const chatRef = useRef(model.startChat({
        history: [...chatHistory],
        generationConfig: {
            maxOutputTokens: 4000,
        },
    }));
    const sessionName = useRef(`session_${Date.now()}-${Math.round(Math.random()*100)}`);
    const messagesEndRef = useRef();


    async function uploadFiles(files) {
        const fileRes = await Promise.all(Array.from(files, async (file) => {
            // uploadFile(item)
            const storageRef = ref(storage, `${sessionName.current}/${file.file.name}`);
            const response = await uploadBytes(storageRef, file.file);
            const url = await getDownloadURL(response.ref);
            
            file.url = url;
            return file;
        }));

        return fileRes; // list of urls from firebase
    }
    async function aiResponse() {
        let query = queryText.trim();
        document.getElementById('user_input').value = '';
        setQueryText('')
        setDisableSending(true)

        if(query.length === 0 && inputFiles.length === 0) {
            return alert('Please provide instructions for banner animation or attach files for BannerBee.')
        }
        setChatHistory((prev)=> [
            ...prev,
            { role: "user", parts: [{ text: query, files: inputFiles}] },
        ]);

        let uploadedFiles = [];
        
        if(inputFiles.length > 0) {
            uploadedFiles = await uploadFiles(inputFiles);
            setAllUploadedFiles([...allUploadedFiles, ...uploadedFiles])
            setInputFiles([])
        }

        

        let instructionForImages = ' Here are the images i have: ' + uploadedFiles.map((file, i) => {
            return (
                i + '-image\n' +
                "name: " + file.file.name + '\n' +
                "description: " + file.description + '\n' +
                "width: " + file.size.width + '\n' +
                "height: " + file.size.height + '\n' +
                "url: " + file.url + '\n'
            )
        });

        if(uploadedFiles.length>0) {
            query = query + instructionForImages;
        }

        let modelRes;
        try {
            await chatRef.current.sendMessage(query).then((value)=> {
                modelRes = formatAIText(value.response.text());
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
        if(modelRes && (modelRes.text || modelRes.html)) {
            setModelResult(modelRes);

            setChatHistory((prev)=> [
                ...prev,
                // { role: "user", parts: [{ text: query }] },
                { role: "model", parts: [{ text: (modelRes.text ? modelRes.text : 'Banner is ready, it is in the preview section: ')}] }
            ]);
            scrollToBottom();
        }

        //allow user to send next message
        setDisableSending(false)
    }
    function replaceHtmlUrls(html) {
        let imgsFromHtml = [];
        for(let i=0;i<allUploadedFiles.length;i++) {
            if(html.includes(allUploadedFiles[i].url)) {
                imgsFromHtml.push(allUploadedFiles[i]);
                html = html.replaceAll(`${allUploadedFiles[i].url}`, `./images/${allUploadedFiles[i].file.name}`)
            }
        }
        //setting only used images;
        setAllUsedFiles(imgsFromHtml);
        return [html, imgsFromHtml];
    }
    function downloadHtml(html) {
        if(!html) {
            return alert("HTML is empty")
        }

        const [newHtml, imgsFromHtml] = replaceHtmlUrls(html)
        const zip = new JSZip()
        // in case if folder is needed
        const folder = zip.folder('images')
        if(imgsFromHtml.length>0) {
            imgsFromHtml.forEach((file)=> {
                const blobPromise = fetch(file.url).then(r => {
                    if (r.status === 200) return r.blob()
                    return Promise.reject(new Error(r.statusText))
                })
                const name = file.file.name;
                folder.file(name, blobPromise)
            })
        }
        const htmlBlobPromise = fetch("data:text/html;charset=utf-8," + encodeURIComponent(newHtml)).then(r => {
            if (r.status === 200) return r.blob()
            return Promise.reject(new Error(r.statusText))
        })
        zip.file('index.html', htmlBlobPromise)
        zip.generateAsync({type:"blob"})
            .then(blob => saveAs(blob, sessionName.current))
            .catch(e => console.log(e));
    }
    
    function formatAIText(response) {
        // Regex to extract HTML code inside triple backticks
        const htmlRegex = /```html\n([\s\S]*?)```/;
        const match = response.match(htmlRegex);
        // Extract HTML and remove it from the response text
        let htmlPart = match ? match[1] : "";
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

        if(!htmlPart && modelResult.html) {
            htmlPart = modelResult.html
        }

        getAdSize(htmlPart)
        return { text: textPart, html: htmlPart  };
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
    function checkImageSize(e) {
        if(!e.files[0]) {
            return
        }
        const img = document.createElement("img");
        const promise = new Promise((resolve, reject) => {
            img.onload = () => {
                const width  = img.naturalWidth;
                const height = img.naturalHeight;

                resolve({width: width, height: height});
            };
            // Reject promise on error
            img.onerror = reject;
        });
        // Setting the source makes it start downloading and eventually call `onload`
        img.src = window.URL.createObjectURL(e.files[0]);
        promise.then((value) => {
            e.setAttribute("data-image_width", value.width);
            e.setAttribute("data-image_height", value.width);
        }).catch((error) => {
            console.error(error);
        });

        return promise;
    }
    function getAdSize (htmlString) {
        const match = htmlString.match(/<meta\s+name=["']ad\.size["']\s+content=["']width=(\d+),height=(\d+)["']/);
        
        if (match) {
            setIframeSize({
                width: parseInt(match[1], 10),
                height: parseInt(match[2], 10)
            })
        } else {
            setIframeSize({
                width: 800,
                height: 400
            })
        }
    }

    function scrollToBottom () {
        // messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: "end"})
    }

    const ModalWithInputs = () => {
        function saveFilesInState() {
            const modalInputs = document.getElementById('modalInputs');
            const fileInputs = modalInputs.querySelectorAll('[type=file]');
            const fileDescs = modalInputs.querySelectorAll('[data-file_desc]');

            let filesArr = [];

            for(let i=0;i<fileInputs.length;i++) {
                if(fileInputs[i].files[0]) {
                    filesArr.push({ file: fileInputs[i].files[0], description: fileDescs[i].value, size: {width: fileInputs[i].getAttribute('data-image_width'), height: fileInputs[i].getAttribute('data-image_height')}})
                }
            }
            setInputFiles([...inputFiles, ...filesArr]);
        }
        
        let inputsQuantity = 8;
        return (
            <div className={`modal ${inputsModalOpen ? 'modal_open' :''}`} id="modalInputs">
                <button onClick={(e)=>{setInputsModalOpen(false)}} className="close_modal button_no_style">✕</button>
                <div className="input_list">
                    {[...Array(inputsQuantity)].map((el, i)=> {
                        return (
                            <div className="inputs_row" key={i}>
                                <div className="input_wrap">
                                    {/* <label htmlFor={'fileInput-' + i}></label> */}
                                    <input type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={(e)=>checkImageSize(e.target)}/>
                                    <button className="clear_input_button button_no_style" onClick={(e)=>{e.target.parentElement.querySelector("[type=file]").value = ''}}>✕</button>
                                </div>
                                
                                <div>
                                    {/* <label htmlFor={'fileDesc-' + i}>File description: </label> */}
                                    <input type="text" className="file_description" placeholder="File desctiption" data-file_desc/>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <button className="button_no_style submit_input_files" onClick={()=>{saveFilesInState(); setInputsModalOpen(false)}}>Submit</button>
            </div>
        )
    }

    function openMobilePreview () {
        const container = document.getElementById('preview_container');
        container.classList.toggle('active')
    }
    // function clearChat () {
    //     localStorage.clear();
    //     setChatHistory([])
        
    // }
    return (
        <div>
            <div className="app">
                <div className="header">
                    <div className="logo">
                        <h1>BannerBee<img src={HoneyBeeImg} alt="bee img"/></h1>
                    </div>
                    <div className="user-settings">
                        {/* <button className={`clear_chat button_no_style`}  onClick={()=>{clearChat()}}>
                            <img src={BinImg} alt="trash bin"/>
                        </button> */}
                        <div className="dark-light" onClick={() => document.body.classList.toggle('dark-mode')}>
                            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                        </div>
                        <div className="settings">
                            <button className={`open_html_preview button_no_style`}  onClick={()=>{openMobilePreview()}}>
                                <img src={EyeImg } alt="html preview"/>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="wrapper">
                <div className="chat-area">
                <div className="chat-area-main">
                    {
                        chatHistory !== null ? chatHistory.map((message, id)=> {
                            return <div className={`chat-msg ${message.role}`} key={id}>
                                    <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank" className="chat-msg-profile">
                                        <img className="chat-msg-img" src={message.role === 'user' ? MyImg : BeeImg} alt="me" />
                                    </a>
                                    <div className="chat-msg-content">
                                        {
                                            message.role === 'user' ?
                                            <div className="user_msg_wrap"><p className="chat-msg-text">{message.parts[0].text}</p> 
                                                {message.parts[0].files ?
                                                    <span className="files_list">{message.parts[0].files.map((file, id) => {
                                                            return <span key={id}>{file.file.name}</span>
                                                })}</span> : null}
                                            </div> :
                                            <p className="chat-msg-text" dangerouslySetInnerHTML={{ __html: message.parts[0].text }}></p>   
                                        }
                                    </div>
                                </div>
                        }) : null
                    }
                    <div ref={messagesEndRef} className="scroll_block" />
                </div>
                <div className="chat-area-footer">
                    <span className="attached_files_list">{inputFiles.map((file, id)=> {
                        return <span key={id}>{file.file.name}</span>
                    })}</span>
                    <button className="button_no_style button_send_files" onClick={()=>{setInputsModalOpen(true)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-paperclip">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                    </button>
                    
                    
                    <textarea type="text" id="user_input" placeholder="Type your request here..." onChange={(e)=> {
                        e.target.style.height = 59+'px';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        setQueryText(e.target.value);}}/>
                    
                    <button disabled={disableSending} className="button_no_style send_button" onClick={()=> aiResponse()}><span>➤</span></button>
                    <span className="developed_by">Developed by: <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank">Adilet Aitmatov</a></span>
                </div>
                </div>
                <div className="detail-area" id="preview_container">
                {
                    <div id="preview_wrap" onClick={(e)=> htmlPreviewFull ? fullScreeHtmlPreview() : null }>
                        <div className="html_preview_control">
                            <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={(e)=>{e.stopPropagation(); reloadHtmlPreview()}}>Reload</button>
                            <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={(e)=>{e.stopPropagation(); downloadHtml(modelResult.html)}}>Download</button>
                            {
                                htmlPreviewFull ? 
                                <button className="preview_control_button button_no_style " disabled={modelResult.html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Exit Full Screen</button> :
                                <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={(e)=>{e.stopPropagation(); fullScreeHtmlPreview()}}>Enter Full Screen</button>
                            }
                        </div>
                        {!modelResult.html ? <span>HTML is not generated yet</span> : null}
                        <div className="iframe_wrap">
                            <iframe onClick={(e)=> e.preventDefault()} srcDoc={modelResult.html} frameBorder="0" id="html_preview" width={iframeSize.width} height={iframeSize.height}></iframe>
                        </div>
                    </div>
                }
                </div>
                </div>
            </div>
            <ModalWithInputs /> 
        </div>
        
    )
}

export default Chat;