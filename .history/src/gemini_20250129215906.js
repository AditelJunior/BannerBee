const { GoogleGenerativeAI } = require("@google/generative-ai");

export const genAI = new GoogleGenerativeAI("AIzaSyAtDPQTc0jSpp3W8iQPwzMSZO4SYSJojQI");
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });