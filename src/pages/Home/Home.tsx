import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSelector, useDispatch } from "react-redux";

import Messages from "./../../components/Messages/Messages";
import Preview from "./../../components/Preview/Preview";
import FileInputModal from "./../../components/FileInputModal/FileInputModal";

import { ChatItem, File } from "../../../types/types";
import { RootState } from "../../state/store";
import { useHomeContext } from '../../context/HomeContext';


import BeeImg from './../../images/bee.jpg';
import EyeImg from './../../images/eye.png';
import HoneyBeeImg from './../../images/honeybee.png';
import "./styles.scss";

const Home = () => {
   const [modelResult, setModelResult] = useState<any>({});
   const [queryText, setQueryText] = useState<string>('');
   const [allUploadedFiles, setAllUploadedFiles] = useState<File[]>([]);

   const [disableSending, setDisableSending] = useState<boolean>(false)
   const { inputFiles, setInputFiles } = useHomeContext();
   const [chatHistory, setChatHistory] = useState<ChatItem[]>([
      { 
         role: "user", 
         parts: [{ text: "Hello!"}] 
      },
      { 
         role: "model", 
         parts: [{ text: "Hello! My name is BannerBee. I create animated banners tailored to your needs. Please provide the banner <strong>SIZE (Width X Height)</strong> and any specific instructions for the animation,  and any images you'd like me to include. I'm here to bring your vision to life!"}] 
      },
   ]);

   const chatRef = useRef(model.startChat({
            //   history: [...chatHistory],
              generationConfig: {
                  temperature: 2.0,
                  maxOutputTokens: 4000,
              },
          }));
   const sessionName = useRef<string>(`session_${Date.now()}-${Math.round(Math.random()*100)}`);
   const messagesEndRef = useRef(null);

   const inputFilesStore = useSelector((state:RootState) => state.files.inputFiles);
   const dispatch = useDispatch();

    function scrollToBottom () {
        // messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: "end"})
    }

   async function uploadFiles(files:File[]) {
      const fileRes = await Promise.all(Array.from(files, async (file) => {
         const storageRef = ref(storage, `${sessionName.current}/${file.file.name}`);
         const response = await uploadBytes(storageRef, file.file);
         const url = await getDownloadURL(response.ref);

         file.url = url;
         return file;
      }));

      return fileRes; // list of urls from firebase
   }
   
      async function aiResponse() {
         let query:string = queryText.trim();
         const userInput: any = document.getElementById('user_input');

         userInput.value = '';
         userInput.style.height = 59+'px';
         userInput.style.height = userInput.scrollHeight + 'px';
        
        setQueryText('');
        setDisableSending(true);

        if(query.length === 0 && inputFiles.length === 0) {
            return alert('Please provide instructions for banner animation or attach files for BannerBee.');
        }
        setChatHistory((prev:ChatItem[])=> [
            ...prev,
            { role: "user", parts: [{ text: query, files: inputFiles}] },
        ]);

        let uploadedFiles: File[] = [];
        
        if(inputFiles.length > 0) {
            uploadedFiles = await uploadFiles(inputFiles);
            setAllUploadedFiles([...allUploadedFiles, ...uploadedFiles])
            setInputFiles([]);
            dispatch({type: 'files/clearFiles'})
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
     
        let modelRes: { text?: string, html?: string };
        try {
            await chatRef.current.sendMessage(query).then((value:any)=> {
                modelRes = formatAIText(value.response.text());
                if(modelRes && (modelRes.text || modelRes.html)) {
                  setModelResult(modelRes);
      
                  setChatHistory((prev:ChatItem[])=> [
                      ...prev,
                      // { role: "user", parts: [{ text: query }] },
                      { role: "model", parts: [{ text: (modelRes.text ? modelRes.text : 'Banner is ready, it is in the preview section: ')}] }
                  ]);
                  scrollToBottom();
              }
            });
        } catch (error) {
            alert("Error occured while generating banner. Please try again.");
            console.error("Error sending message:", error);
        }
        //allow user to send next message
        setDisableSending(false)
   }

   function formatAIText(response:string) {
        // Regex to extract HTML code inside triple backticks
        const htmlRegex = /```html\n([\s\S]*?)```/;
        const match = response.match(htmlRegex);
        // Extract HTML and remove it from the response text
        let htmlPart:string = match ? match[1] : "";
        let textPart:string = response.replace(htmlRegex, "").trim();
      
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

      //   getAdSize(htmlPart)
        return { text: textPart, html: htmlPart  };
   }

   function openMobilePreview () {
      const container: any = document.getElementById('preview_container');
      container.classList.toggle('active')
   }

   return (
      <div>
         <div className="app">
            <div className="header">
               <div className="logo">
                  <h1>BannerBee<img src={HoneyBeeImg} alt="bee img"/></h1>
               </div>
               <div className="user-settings">
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
                        chatHistory !== null 
                           ? <Messages chatHistory={chatHistory}/> 
                           : null 
                     }
                     {
                     // LOADER 
                        disableSending ?
                        <div className={`chat-msg model`}>
                              <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank" className="chat-msg-profile">
                                 <img className="chat-msg-img" src={BeeImg} alt="bee img thinking" />
                              </a>
                              <div className="chat-msg-content">
                                 <p className="chat-msg-text">Generating...</p>   
                              </div>
                        </div> : null
                     }
                     <div ref={messagesEndRef} className="scroll_block" />
                  </div>
                  <div className="chat-area-footer">
                     <span className="attached_files_list">{inputFiles.map((file:any, id:number)=> {
                        return <span key={id}>{file.file.name}</span>
                     })}</span>
                     <button className="button_no_style button_send_files" onClick={()=>{dispatch({type: 'filesInputModal/open'})}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-paperclip">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                     </button>    
                        
                     <textarea id="user_input" placeholder="Type your request here..." onChange={(e)=> {
                        e.target.style.height = 59+'px';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        setQueryText(e.target.value);}}/>
                        
                     <button disabled={disableSending} className="button_no_style send_button" onClick={()=> aiResponse()}><span>➤</span></button>
                     <span className="developed_by">Developed by: <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank">Adilet Aitmatov</a></span>
                  </div>
               </div>
               <div className="detail-area" id="preview_container">
               {
                  <Preview html={modelResult.html} sessionName={sessionName.current} allUploadedFiles={allUploadedFiles}/>
               }
               </div>
            </div>
         </div>
         <FileInputModal /> 
      </div>
   )
}

export default Home;