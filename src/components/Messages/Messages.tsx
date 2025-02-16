import React, {useState, useEffect, useRef} from "react";
// import MyImg from './../../images/me.jpeg';
import MyImg from './../../images/Adilet_Aitmatov_Red_photo.jpg';
import BeeImg from './../../images/bee.jpg';
import { ChatItem } from "../../../types/types";


const Messages = (props:any) => {
    const chatHistory = props.chatHistory;

    return (chatHistory.map((message:ChatItem, id:number) => {
        return <div className={`chat-msg ${message.role}`} key={id}>
            <a href="https://www.linkedin.com/in/adilet-aitmatov/" target="_blank" className="chat-msg-profile">
                <img className="chat-msg-img" src={message.role === 'user' ? MyImg : BeeImg} alt="avatar img" />
            </a>
            <div className="chat-msg-content">
                {
                    message.role === 'user' ?
                    <div className="user_msg_wrap"><p className="chat-msg-text">{message.parts[0].text}</p> 
                        {message.parts[0].files ?
                            <span className="files_list">{message.parts[0].files.map((file:any, id:number) => {
                                    return <span key={id}>{file.file.name}</span>
                        })}</span> : null}
                    </div> :
                    <p className="chat-msg-text" dangerouslySetInnerHTML={{ __html: message.parts[0].text }}></p>   
                }
            </div>
        </div>
    }))
}
export default Messages