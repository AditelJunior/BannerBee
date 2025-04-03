import React, {useState, useEffect, useRef} from "react";
import { model } from "../../gemini";
import { storage, auth } from "../../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useSelector, useDispatch } from "react-redux";
import { setSessions, setCurrentSessionId, updateSession, setCurrentPreview, removeSession } from "../../state/sessionsList/sessionsList";
import { RootState } from "../../state/store";

import { Link } from "react-router";

import Messages from "./../../components/Messages/Messages";
import Preview from "./../../components/Preview/Preview";
import FileInputModal from "./../../components/FileInputModal/FileInputModal";

import { ChatItem, File, Session } from "../../../types/types";
import { useHomeContext } from '../../context/HomeContext';

import BeeImg from './../../images/bee.jpg';
import EyeImg from './../../images/eye.png';
import HoneyBeeImg from './../../images/honeybee.png';

import { FaUser, FaArrowLeft, FaArrowRight, FaTrashAlt, FaHtml5 } from "react-icons/fa";

import "./styles.scss";

const Home = () => {
   const [queryText, setQueryText] = useState<string>('');
   const [disableSending, setDisableSending] = useState<boolean>(false)
   const {inputFiles, setInputFiles} = useHomeContext();
   const sessions = useSelector((state:RootState) => state.sessionsList.sessions);
   const currentSession = useSelector((state:RootState) => state.sessionsList.currentSessionId);
   const currentPreview = useSelector((state:RootState) => state.sessionsList.currentPreview);
   
   const sessionName = useRef<string>(`session_${Date.now()}-${Math.round(Math.random()*100)}`);
   const messagesEndRef = useRef(null);
   const userInputRef = useRef <HTMLTextAreaElement> (null);
   const userRef = useRef(auth.currentUser);

   const dispatch = useDispatch();

   const chatConfigs = {
      temperature: 2.0,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
   }
   const defaultHistory = {
      messages: [
         {role: "user",  parts: [{ text: "Hello!"}]},
         { role: "model", parts: [{ text: `Hello! My name is BannerBee. I create animated banners tailored to your needs. Please provide the banner <strong>SIZE (Width X Height)</strong> and any specific instructions for the animation,  and any images you'd like me to include. I'm here to bring your vision to life!`,}]},
      ],
      database: [{ role: "user", parts: [{ text: '{ "text": "Hello!"}'}]},
      { role: "model", parts: [{ text: `{"text":"Hello! My name is BannerBee. I create animated banners tailored to your needs. Please provide the banner <strong>SIZE (Width X Height)</strong> and any specific instructions for the animation,  and any images you'd like me to include. I'm here to bring your vision to life!", "html": ""}`}]},]
   }
   
   const [messagesList, setMessagesList] = useState<ChatItem[]>(defaultHistory.database);

   const [chatHistory, setChatHistory] = useState<ChatItem[]>(defaultHistory.messages);

   useEffect(() => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
         // document.body.classList.remove('dark-light');
         document.body.classList.add('dark-mode');
      }

      getSessions();
      if(!currentSession) {
         createNewSession();
      } else if(sessions.find((session:Session) => session.id === currentSession)) {
         switchChat(currentSession);
      } else {
         createNewSession();
      }
   }, []);

   const getSessions = async () => {
      if(!auth.currentUser) return;
      const listOfSessions = await getDocs(collection(db, "sessions", auth.currentUser.uid, "userSessions"));
      const sessionsList:Session[] = [];

      listOfSessions.forEach((doc) => {
         let sessionDate = new Date(Number(doc.data().time.seconds)*1000);
         let sessionTime = sessionDate.toLocaleTimeString();
         let sessionDateStr = sessionDate.toLocaleDateString();
         sessionsList.push({id: doc.id, chatHistory: doc.data().chatHistory, time: sessionDateStr + ' ' + sessionTime});
      });
      dispatch(setSessions(sessionsList));
   }

   function changeColorMode() {
      document.body.classList.toggle('dark-mode');
   }

   const chatRef = useRef(model.startChat({
      history: [...messagesList],
      generationConfig: chatConfigs,
   }));

   const switchChat = (id:string) => {
      const newChatHistory = [...sessions.find((session:Session) => session.id === id)?.chatHistory || []];
      const formattedChatHistory = newChatHistory.map((message: ChatItem) => {
         if (message.role === "model") {
             const parsedMsg = formatAIText(message.parts[0].text);
             return {
               role: "model",
               parts: [{
                        text: parsedMsg.text,
                        html: parsedMsg.html,
                     },],
             };
         } else if (message.role === "user") {
             const parsedMsgUser = JSON.parse(message.parts[0].text);
             return {
                 role: "user",
                 parts: [{
                         text: parsedMsgUser.text,
                         files: parsedMsgUser.files,
                     },],
             };
         }
         return message;
     });

      setChatHistory(formattedChatHistory);
      setMessagesList(newChatHistory);
      chatRef.current = model.startChat({
         history: [...newChatHistory],
         generationConfig: chatConfigs,
      });
      dispatch(setCurrentSessionId(id));
      sessionName.current = id;
   }

   

   const uploadChatHistory = async (history:ChatItem[]) => {
      try {
         const date = new Date();

         if (!userRef.current) {
            throw new Error("User is not authenticated.");
         }
 
         const uid = userRef.current.uid; // Get the user's UID
         const sessionDocRef = doc(db, "sessions", uid, "userSessions", sessionName.current);

         let sessionDate = new Date();
         let sessionTime = sessionDate.toLocaleTimeString();
         let sessionDateStr = sessionDate.toLocaleDateString();
         // // Upload chatHistory to Firestore
         await setDoc(sessionDocRef, { time: date, chatHistory: history });
         dispatch(updateSession({id: sessionName.current, chatHistory: history, time: sessionDateStr + ' ' + sessionTime}));
      } catch (error) {
         console.error("Error uploading chat history:", error);
      }
   }

    function scrollToBottom () {
        // messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: "end"})
    }

   async function uploadFiles(files:File[]) {
      const fileRes = await Promise.all(
         Array.from(files, async (file) => {
             const storageRef = ref(storage, `${sessionName.current}/${file.file.name}`);
             const response = await uploadBytes(storageRef, file.file);
             const url = await getDownloadURL(response.ref);
             return {
                 ...file,
                 url, // Add the URL without mutating the original object
             };
         })
     );

      return fileRes; // list of urls from firebase
   }
   
   async function aiResponse() {
      let query:string = queryText.trim();

      if(query.length === 0 && inputFiles.length === 0) {
         return alert('Please provide instructions for banner animation or attach files for BannerBee.');
      }
      
      resetUserInput();
      setQueryText('');
      setDisableSending(true);

      let uploadedFiles: File[] = [];
      
      if(inputFiles.length > 0) {
         uploadedFiles = await uploadFiles(inputFiles);
         setInputFiles([]);
      }

      const jsonFiles = uploadedFiles.map((file) => ({
         name: file.file.name,
         description: file.description,
         width: file.size.width,
         height: file.size.height,
         url: file.url,
     }));
      let textPartUser = { text: query, files: jsonFiles};
      setChatHistory((prev:ChatItem[])=> [
         ...prev,
         { role: "user", parts: [textPartUser] },
      ]);  

      setMessagesList((prev:ChatItem[]) => {
         const newHis = [...prev, { role: "user", parts: [{ text: JSON.stringify(textPartUser)}] }]
         uploadChatHistory(newHis);
         return newHis;
      });

      let modelRes: { text: string | '', html: string | '' };
      try {
         await chatRef.current.sendMessage(JSON.stringify(textPartUser)).then((value:any)=> {
            modelRes = formatAIText(value.response.text());
            setChatHistory((prev:ChatItem[])=> [
               ...prev,
               { role: "model", parts: [{ text: (modelRes.text ? modelRes.text : 'Banner is ready, you can find it in preview section'), html: modelRes.html}] }
            ]);

            setMessagesList((prev:ChatItem[]) => {
               const newHis = [ ...prev, { role: "model", parts: [{ text: value.response.text() }] }]
               uploadChatHistory(newHis);
               return newHis;
            });
            if(modelRes && modelRes.html) {
               dispatch(setCurrentPreview(modelRes.html))
               scrollToBottom();
            }
         });
      } catch (error) {
         alert("Error occured while generating banner. Please try again.");
      }
      setDisableSending(false)
   }

   function formatAIText(response:string) {
      const parsedResponse = JSON.parse(response);

        let htmlPart:string = parsedResponse.html;
        let textPart:string = parsedResponse.text;
      
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
      
      return { text: textPart, html: htmlPart.trim() };
   }

   const createNewSession = () => {
      sessionName.current = `session_${Date.now()}-${Math.round(Math.random()*100)}`;
      dispatch(setCurrentSessionId(sessionName.current))
      setMessagesList(defaultHistory.database);
      setChatHistory(defaultHistory.messages);
   }
   const removeSessionHandler = async (sessionId:string) => {
      dispatch(removeSession(sessionId))

      const listRef = ref(storage, sessionId);
      listAll(listRef).then(function (result) {
         result.items.forEach(function (file) {
            deleteObject(file).then(() => {
               // File deleted successfully
             }).catch((error) => {
               // Uh-oh, an error occurred!
             });
         });
     }).catch(function (error) {
         // Handle any errors
     });
      if(userRef.current) {
         const docRef = doc(db, "sessions", userRef.current.uid, "userSessions", sessionId);
         await deleteDoc(docRef);
      }

   }
   function resetUserInput() {
      userInputRef.current!.value = '';
      userInputRef.current!.style.height = '59px';
      userInputRef.current!.style.height = userInputRef.current!.scrollHeight + 'px';
      
   }
   function textAreaHandler(e:any) {
      const textArea = e.target;
      textArea.style.height = 59+'px';
      textArea.style.height = textArea.scrollHeight + 'px';
      setQueryText(textArea.value);
   }

   function openMobilePreview () {
      const container: any = document.getElementById('preview_container');
      container.classList.toggle('active')
   }
   function openSessions() {
      const sessionsArea: any = document.getElementById('sessions-area');
      sessionsArea.classList.add('active');
   }
   function closeSessions() {
      const sessionsArea: any = document.getElementById('sessions-area');
      sessionsArea.classList.remove('active');
   }
   return (
      <div>
         <div className="app">
            <div className="header">
               <div className="logo">
                  <h1>BannerBee<img src={HoneyBeeImg} alt="bee img"/></h1>
               </div>
               <div className="user-settings">
                  <div className="dark-light" onClick={() => changeColorMode()}>
                        <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                  </div>
                  <div className="settings">
                        <button className={`open_html_preview button_no_style`}  onClick={()=>{openMobilePreview()}}>
                           HTML<FaHtml5/>
                        </button>
                  </div>
                  <div className="user_profile">
                     <Link to='/profile' className="profile_link">
                        {
                           auth && auth.currentUser && auth.currentUser.photoURL ? (
                                 <img
                                    src={auth.currentUser.photoURL}
                                    alt="Profile"
                                    className="profile_photo_header"
                                 />
                           ) :
                           <div className='profile_photo_header'><FaUser /></div>
                        }
                     </Link>
                  </div>
               </div>
            </div>
            <div className="wrapper">
               <div className="sessions-area" id="sessions-area">
                  <div className="sessions_scroll_area">
                     <button className="close_sessions" onClick={()=>closeSessions()}><FaArrowLeft/></button>
                     <button className="open_sessions" onClick={()=>openSessions()}><FaArrowRight/></button>
                     <span className="sessions_header">Sessions:</span>
                     <button onClick={()=>{createNewSession(); closeSessions()} } className="new_session_button">New Session</button>
                     <ul className="sessions-list">
                        {
                           sessions.map((session:Session, id:number) => {
                              return <li key={id} className={session.id === currentSession ? 'active_session' : ''} onClick={()=> dispatch(setCurrentSessionId(session.id))}>
                                 <button onClick={()=>{switchChat(session.id); closeSessions()}}>{ session.id } <br />{session.time }</button>
                                 <button onClick={()=> {removeSessionHandler(session.id); }} className="btn_remove"><FaTrashAlt /></button>
                              </li>
                           })
                        }
                     </ul>
                  </div>
               </div>
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
                              <div className="chat-msg-profile">
                                 <img className="chat-msg-img" src={BeeImg} alt="bee img thinking" />
                              </div>
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
                        
                     <textarea 
                        id="user_input" 
                        ref={userInputRef}
                        placeholder="Type your request here..." 
                        onKeyDown={(e:any)=> (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) ? (e.preventDefault(), aiResponse()) : null } 
                        onChange={(e)=> (textAreaHandler(e))} />
                        
                     <button disabled={disableSending} className="button_no_style send_button" onClick={()=> aiResponse()}><span>➤</span></button>
                     <span className="developed_by">Developed by: <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank">Adilet Aitmatov</a></span>
                  </div>
               </div>
               <div className="detail-area" id="preview_container">
                  {
                     <Preview html={currentPreview} sessionName={currentSession} />
                  }
               </div>
            </div>
         </div>
         <FileInputModal /> 
      </div>
   )
}

export default Home;