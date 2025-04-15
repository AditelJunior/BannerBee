import React from "react";
import BeeImg from './../../images/bee.jpg';
import { ChatItem } from "../../../types/types";

import { FaUser, FaHtml5 } from "react-icons/fa";
import { setCurrentPreview } from "../../state/sessionsList/sessionsList";

import { useDispatch } from "react-redux";
import { auth } from "../../firebase";

const Messages = (props:any) => {

    const dispatch = useDispatch();
    const chatHistory = props.chatHistory;

    return (chatHistory.map((message:ChatItem, id:number) => {

        return <div className={`chat-msg ${message.role}`} key={id}>
            <div className="chat-msg-profile">
                {
                    message.role === 'user' ? (
                        auth && auth.currentUser && auth.currentUser.photoURL ? (
                            <img
                                src={auth.currentUser.photoURL}
                                alt="Profile"
                                className="chat-msg-img"
                            />
                        ) : (<div className='chat-msg-img'> <FaUser /></div>)
                    ) : (
                        <img className="chat-msg-img" alt="bee img" src={BeeImg} />
                    )
                }
            </div>
            <div className="chat-msg-content">
                {
                    message.role === 'user' ?
                    <div className="user_msg_wrap"><p className="chat-msg-text">{message.parts[0].text}</p> 
                        {message.parts[0].files ?
                            <span className="files_list">{message.parts[0].files.map((file:any, id:number) => {
                                    return <span key={id}>{file.name}</span>
                        })}</span> : null}
                        {message.parts[0].referenceTemplate?.html ?
                            <span className="referenced_html">Reference: <button onClick={()=> dispatch(setCurrentPreview(message.parts[0].referenceTemplate?.html || ''))} className="html_chat_button">{message.parts[0].referenceTemplate.title}</button></span> : null}
                    </div> :
                    <div className="model_msg_wrap">
                        <p className="chat-msg-text" dangerouslySetInnerHTML={{ __html: message.parts[0].text }}></p> 
                        {message.parts[0].html && message.parts[0].html.length ? <button onClick={()=>dispatch(setCurrentPreview(message.parts[0].html || ''))} className="html_chat_button">HTML <FaHtml5/></button> : null}  
                    </div>
                }
            </div>
        </div>
    }))
}
export default Messages