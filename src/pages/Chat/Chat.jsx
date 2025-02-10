import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "./../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import FileSaver, {saveAs} from "file-saver";

import MyImg from './../../images/me.jpeg';
import BeeImg from './../../images/bee.jpg';
import "./styles.scss";

const Chat = () => {
    const [modelResult, setModelResult] = useState({});
    const [queryText, setQueryText] = useState('');
    // const [chatMessages, setChatMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [inputFiles, setInputFiles] = useState([]);
    // const [fileInputsCount, setFileInputsCount] = useState(1);
    const [htmlPreviewFull, setHtmlPreviewFull] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [allUploadedFiles, setAllUploadedFiles] = useState([]);
    const [allUsedFiles, setAllUsedFiles] = useState([]);
    const [inputsModalOpen, setInputsModalOpen] = useState(false);

    const [iframeSize, setIframeSize] = useState({})
    

    let chatRef = useRef(model.startChat({
        generationConfig: {
            maxOutputTokens: 3000,
        },
    }));

    const messagesEndRef = useRef();

    useEffect(() => {
        setSessionName(`session_${Date.now()}`);
    }, [])

    async function uploadFiles(files) {
        console.log('upload files')
        const fileRes = await Promise.all(Array.from(files, async (file) => {
            // uploadFile(item)
            const storageRef = ref(storage, `${sessionName}/${file.file.name}`);
            const response = await uploadBytes(storageRef, file.file);
            const url = await getDownloadURL(response.ref);
            
            file.url = url;
            return file;
        }));

        return fileRes; // list of urls from firebase
    }
    async function aiResponse() {
        setChatHistory((prev)=> [
            ...prev,
            { role: "user", parts: [{ text: queryText }] },
        ]);

        let uploadedFiles = [];
        
        if(inputFiles.length > 0) {
            uploadedFiles = await uploadFiles(inputFiles);
            setAllUploadedFiles([...allUploadedFiles, ...uploadedFiles])
            setInputFiles([])
        }

        let query = queryText;

        let instructionForImages = ' Here are the images i have: ' + uploadedFiles.map((file, i) => {
            console.log(file)
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
            console.log(query)
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
                { role: "model", parts: [{ text: (modelRes.text ? modelRes.text : 'Here is your Banner: ')}] }
            ]);
            scrollToBottom();
        }
    }
    function replaceHtmlUrls(html) {
        let imgsFromHtml = [];
        console.log(allUploadedFiles)
        for(let i=0;i<allUploadedFiles.length;i++) {
            if(html.includes(allUploadedFiles[i].url)) {
                console.log(allUploadedFiles[i].url)
                imgsFromHtml.push(allUploadedFiles[i]);
                html = html.replaceAll(`${allUploadedFiles[i].url}`, `./images/${allUploadedFiles[i].file.name}`)
            }
        }
        console.log(imgsFromHtml)
        //setting only used images;
        setAllUsedFiles(imgsFromHtml);
        return [html, imgsFromHtml];
    }
    function downloadHtml( html) {
        if(!html) {
            return alert("HTML is empty")
        }

        const [newHtml, imgsFromHtml] = replaceHtmlUrls(html)
        // console.log(html)
        const zip = new JSZip()
        // in case if folder is needed
        const folder = zip.folder('images')
        console.log(imgsFromHtml)
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
            .then(blob => saveAs(blob, sessionName))
            .catch(e => console.log(e));
    }
    
    const formatAIText = (response) => {
        console.log(response)
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
        messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: "end"})
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
            setInputFiles(filesArr);
            console.log(filesArr)
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
                                    <input type="file" accept="image/png, image/jpeg, image/gif" onChange={(e)=>checkImageSize(e.target)}/>
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
    
    return (
        <div>
            <div className="app">
                <div className="header">
                    <div className="logo">
                        <h1>BannerBee <span>🐝</span></h1>
                        {/* <svg viewBox="0 0 513 513" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M256.025.05C117.67-2.678 3.184 107.038.025 245.383a240.703 240.703 0 0085.333 182.613v73.387c0 5.891 4.776 10.667 10.667 10.667a10.67 10.67 0 005.653-1.621l59.456-37.141a264.142 264.142 0 0094.891 17.429c138.355 2.728 252.841-106.988 256-245.333C508.866 107.038 394.38-2.678 256.025.05z" />
                            <path d="M330.518 131.099l-213.825 130.08c-7.387 4.494-5.74 15.711 2.656 17.97l72.009 19.374a9.88 9.88 0 007.703-1.094l32.882-20.003-10.113 37.136a9.88 9.88 0 001.083 7.704l38.561 63.826c4.488 7.427 15.726 5.936 18.003-2.425l65.764-241.49c2.337-8.582-7.092-15.72-14.723-11.078zM266.44 356.177l-24.415-40.411 15.544-57.074c2.336-8.581-7.093-15.719-14.723-11.078l-50.536 30.744-45.592-12.266L319.616 160.91 266.44 356.177z" fill="#fff" /></svg> */}
                    </div>
                    {/* <div className="search-bar">
                        <input type="text" placeholder="Search..." />
                    </div> */}
                    <div className="user-settings">
                        <div className="dark-light" onClick={() => document.body.classList.toggle('dark-mode')}>
                            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                        </div>
                        <div className="settings">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                        </div>
                    </div>
                </div>
                <div className="wrapper">
                {/* <div className="conversation-area">
                LEFT SIDE
                </div> */}
                <div className="chat-area">
                <div className="chat-area-main">
                    {
                        chatHistory !== null ? chatHistory.map((message, id)=> {
                            return <div className={`chat-msg ${message.role}`} key={id}>
                                    <div className="chat-msg-profile">
                                    
                                        <img className="chat-msg-img" src={message.role === 'user' ? MyImg : BeeImg} alt="me" />
                                        {/* <div className="chat-msg-date">Message seen 2.50pm</div> */}
                                    </div>
                                    <div className="chat-msg-content">
                                        {
                                            message.role === 'user' ?
                                            <p className="chat-msg-text">{message.parts[0].text}</p> :
                                            <p className="chat-msg-text" dangerouslySetInnerHTML={{ __html: message.parts[0].text }}></p>   
                                        }
                                    </div>
                                </div>
                        }) : null
                    }
                    <div ref={messagesEndRef} className="scroll_block" />
                </div>
                <div className="chat-area-footer">
                    <button className="button_no_style button_send_files" onClick={()=>{setInputsModalOpen(true)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-paperclip">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                    </button>
                    
                    
                    <textarea type="text" id="user-input" placeholder="Type your request here..." onChange={(e)=> {
                        e.target.style.height = 59+'px';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        setQueryText(e.target.value);}}/>
                    
                    <button className="button_no_style send_button" onClick={()=> aiResponse()}><span>➤</span></button>
                </div>
                </div>
                <div className="detail-area">
                {
                    // modelResult.html ? 
                    <div id="preview_wrap">
                        <div className="html_preview_control">
                            <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={()=>reloadHtmlPreview()}>Reload</button>
                            <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={()=> downloadHtml(modelResult.html)}>Download</button>
                            {
                                htmlPreviewFull ? 
                                <button className="preview_control_button button_no_style " disabled={modelResult.html ? false : true} onClick={()=>fullScreeHtmlPreview()}>Exit Full Screen</button> :
                                <button className="preview_control_button button_no_style" disabled={modelResult.html ? false : true} onClick={()=>fullScreeHtmlPreview()}>Enter Full Screen</button>
                            }
                        </div>
                        <div className="iframe_wrap">
                            <iframe srcDoc={modelResult.html} frameBorder="0" id="html_preview" width={iframeSize.width} height={iframeSize.height}></iframe>
                        </div>
                    </div>
                    //  : <span>HTML is not generated</span>
                }
                </div>
                </div>
            </div>
            <ModalWithInputs /> 
        </div>
        
    )
}

export default Chat;