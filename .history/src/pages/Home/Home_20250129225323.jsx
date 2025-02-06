import React from "react";
import { model } from "../../gemini";
import "./styles.scss";

import Chatbot from 'react-chatbot-kit';
import config from "../../chatBotHelpers/config";
import ActionProvider from "../../chatBotHelpers/ActionProvider";
import MessageParser from "../../chatBotHelpers/MessageParser";
import 'react-chatbot-kit/build/main.css';


const  Home = () => {
console.log(model)
// const result = model.generateContent(prompt);
// const validateInput = (msg) => {
//     if (msg.trim().length > 0) {
//         return true
//     } else {
//         return false
//     }
// }
  return (
    <div>
        <div className="left_side">
        {/* <Chatbot
            headerText='Chat Bot'
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
            validator={(msg) => validateInput(msg)}
        /> */}
            <div className="chat_form">
                <textarea type="text" />
                <input type="file" />
                <button>Send</button>
            </div>
        </div>
        <div className="right_side">

        </div>
    </div>
  );
};

export default Home;