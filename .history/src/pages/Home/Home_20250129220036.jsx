import React from "react";
import { model } from "../../gemini";
import "./styles.scss";

const  Home = () => {

const result = model.generateContent(prompt);

  return (
    <div>
        <input type="text" />
        result
    </div>
  );
};

export default Home;