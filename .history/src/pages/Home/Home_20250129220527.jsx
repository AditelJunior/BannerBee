import React from "react";
import { model } from "../../gemini";
import "./styles.scss";



const  Home = () => {
console.log(model)
// const result = model.generateContent(prompt);

  return (
    <div>
        <div className="left_side">
            <div className="form">
                <textarea type="text" />
                <input type="file" />
                <button>Send</button>
            </div>
        </div>
        <div className="right_side">

        </div>
        
        result
    </div>
  );
};

export default Home;