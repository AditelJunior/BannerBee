import React from "react";
import { model } from "../../gemini";
import "./styles.scss";

const  Home = async () => {

const result = await model.generateContent(prompt);

  return (
    <div>
        <input type="text" />
    </div>
  );
};

export default Home;