import React from "react";
import { model } from "../../gemini";
import "./styles.scss";



const  Home = () => {
console.log(model)
// const result = model.generateContent(prompt);

  return (
    <div>
        <div>
            <textarea type="text" />
            <input type="file" />
        </div>
        
        result
    </div>
  );
};

export default Home;