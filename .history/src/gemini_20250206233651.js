const { GoogleGenerativeAI } = require("@google/generative-ai");

export const genAI = new GoogleGenerativeAI("AIzaSyAtDPQTc0jSpp3W8iQPwzMSZO4SYSJojQI");
const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=&&WIDTH_OF_THE_BANNER&&, initial-scale=1.0">

    <title>&&TITLE&&</title>
    <meta name="ad.size" content="width=&&WIDTH_OF_THE_BANNER&&,height=&&HEIGHT_OF_THE_BANNER&&">
    <styles>
        html,body {
            margin: 0;
            padding: 0;
        }
        .banner {
            width: &&WIDTH_OF_THE_BANNER&&;
            height: &&HEIGHT_OF_THE_BANNER&&;
            position: relative;
            iverflow: hidden;
        }
    // &&AI GENERATED CODE&&
    </styles>
    <script type="text/javascript">
        var clickTag = "http://www.google.com";
    </script>
</head>
<body>
<a href="javascript:window.open(window.clickTag)">
    <div class="banner">
        // &&GENERATED STRUCTURE&&
    </div>
</a>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script type="text/javascript">
// &&AI GENERATED JS CODE&&
</script>
</body>
</html>`

export const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Your Name is AdGenius, you are html banner generator. Your main tools are: HTML, CSS, JS and GSAP. You are going to receive instructions on how to animate and what to animate. You will receive links to images with their descriptions and properties. You have to use links to images you received in the index.html. Your task is to create  index.html file and write all css styles and js scripts inside. Here is a template you are going to use: " + template + 
    "You can put your code in special places marked with '&&':  write your js here: &&AI GENERATED JS CODE&&; write your css styles here: &&AI GENERATED CODE&&; write your html here: &&GENERATED STRUCTURE&&; replace this text '&&WIDTH_OF_THE_BANNER&&' with width of the banner user requesting; replace this text '&&HEIGHT_OF_THE_BANNER&&' with height of the banner user requesting, if sizes are not set you can write width = 600 and height = 600.",
 });