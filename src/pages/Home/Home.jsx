import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "./../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import FileSaver, {saveAs} from "file-saver";
import "./styles.scss";


const  Home = () => {
    const [modelResult, setModelResult] = useState('');
    const [queryText, setQueryText] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [inputFiles, setInputFiles] = useState([]);
    const [fileInputsCount, setFileInputsCount] = useState(1);
    const [htmlPreviewFull, setHtmlPreviewFull] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [allUploadedFiles, setAllUploadedFiles] = useState([]);
    const [allUsedFiles, setAllUsedFiles] = useState([]);

    useEffect(()=> {
        setSessionName(`session_${Date.now()}`);
    }, [])
    useEffect(()=> {
        // console.log(allUploadedFiles);
    }, [allUploadedFiles])
    async function uploadFile(file) {

        const storageRef = ref(storage, `${sessionName}/${file.file.name}`);
      
        const response = await uploadBytes(storageRef, file.file);

        const url = await getDownloadURL(response.ref);
        file.url = url;
        return file;
    }

    async function uploadFiles() {
        const fileInputs = document.querySelector('.inputs_list').querySelectorAll('[type="file"]')
        const fileDesc = document.querySelector('.inputs_list').querySelectorAll('[data-file_desc]')

        let filesArr = [];

        for(let i=0;i<fileInputs.length;i++) {
            if(fileInputs[i].files[0]) {
                filesArr.push({ file: fileInputs[i].files[0], description: fileDesc[i].value, size: {width: fileInputs[i].getAttribute('data-image_width'), height: fileInputs[i].getAttribute('data-image_height')}})
            }
        }

        // const filePromises = Array.from(filesArr, (item) => uploadFile(item));

        const fileRes = await Promise.all(Array.from(filesArr, (item) => uploadFile(item)));

        return fileRes; // list of urls from firebase
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
        return html;
    }
    function downloadHtml( html) {
        if(!html) {
            return console.log("html is empty")
        }
        html = replaceHtmlUrls(html)

        const zip = new JSZip()
        // in case if folder is needed
        const folder = zip.folder('images')

        if(allUsedFiles.length>0) {
            allUsedFiles.forEach((file)=> {
                const blobPromise = fetch(file.url).then(r => {
                    if (r.status === 200) return r.blob()
                    return Promise.reject(new Error(r.statusText))
                })
                const name = file.file.name;
                folder.file(name, blobPromise)
            })
        }
        const htmlBlobPromise = fetch("data:text/html;charset=utf-8," + encodeURIComponent(html)).then(r => {
            if (r.status === 200) return r.blob()
            return Promise.reject(new Error(r.statusText))
        })
        zip.file('index.html', htmlBlobPromise)
        zip.generateAsync({type:"blob"})
            .then(blob => saveAs(blob, sessionName))
            .catch(e => console.log(e));
    }
    async function createZipFile(html) {
        
    }

    
    async function aiResponse() {
        const fileInputs = document.querySelector('.inputs_list').querySelectorAll('[type="file"]')

        let uploadedFiles = [];
        
        if(fileInputs && fileInputs[0].files[0]) {
            uploadedFiles = await uploadFiles();

        }
        setAllUploadedFiles([...allUploadedFiles, ...uploadedFiles])

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
        
        console.log(query)
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });
        let result = '';
        try {
            result = await chat.sendMessage(query);
            // console.log(result.response.text())
            setModelResult(formatAIText(result.response.text()));
            setChatHistory(prevHistory => [...prevHistory, { role: "user", parts: [{ text: query }] }, { role: "model", parts: [{ text: result.response.text() }] }]);
        } catch (error) {
            console.error("Error sending message:", error);
        }
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
    }

    // async/promise function for retrieving image dimensions for a URL
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
        });
        return promise;
    }

    const InputRow = (i) => {
        return (
            <div className="inputs_row" key={'inputRow'+i}>
                <div>
                    {/* <label htmlFor={'fileInput-' + i}></label> */}
                    <input type="file" id={'fileInput-' + i} accept="image/png, image/jpeg, image/gif" onChange={(e)=>checkImageSize(e.target)}/>
                </div>
                
                <div>
                    {/* <label htmlFor={'fileDesc-' + i}>File description: </label> */}
                    <input type="text" id={'fileDesc-' + i} placeholder="File desctiption" data-file_desc className="file_description"/>
                </div>
                <button>✕</button>
            </div>
        )
    }
  return (
    <div>
        <div className="container_home">
            <div className="left_side">
                <div className="chat_form">
                    <textarea type="text" id="chat_input" placeholder="Enter your request" onChange={(e)=>setQueryText(e.target.value)}/>
                    {/* <input type="file" multiple onChange={(e)=>setInputFiles(e.target.files)}/> */}
                    <button onClick={()=>{setFileInputsCount(fileInputsCount+1)}} disabled={fileInputsCount < 10 ? false : true}>Add Inputs</button>
                    <div className="inputs_list">
                        {
                            [...Array(fileInputsCount)].map((el, i)=> {
                                return (
                                    <InputRow key={i}/>
                                )
                            })
                        }
                    </div>
                    <button onClick={(e)=>{aiResponse()}}>Send</button>
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
                        <button onClick={()=> downloadHtml(modelResult.html)}>Download</button>
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