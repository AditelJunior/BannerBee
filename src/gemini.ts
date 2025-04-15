import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI("AIzaSyAtDPQTc0jSpp3W8iQPwzMSZO4SYSJojQI");
const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=&&WIDTH_OF_THE_BANNER&&, initial-scale=1.0">

    <title>&&TITLE&&</title>
    <meta name="ad.size" content="width=&&WIDTH_OF_THE_BANNER&&,height=&&HEIGHT_OF_THE_BANNER&&">
    <style id="ai_styles">
        /* AI GENERATED CSS */
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
    </style>
    <script type="text/javascript">
        var clickTag = "http://www.google.com";
    </script>
</head>
<body>
<a href="javascript:window.open(window.clickTag)">
    <div class="banner">
        <!-- GENERATED STRUCTURE -->
    </div>
</a>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script type="text/javascript" id="ai_javascript">
// AI GENERATED JS CODE
</script>
</body>
</html>`

const rules ='You have to use links you received in the html;\n' +
            "Use images provided by user. Dont look for images in internet. If you need an image placeholder create html shape and add text that describes it. For example you need to show user a moon. You can create a circle and write inside: 'Moon';\n" +
            "If user asked to animate the image he never sent, you can ask him to do it in the file input field; Never ask him to send URL of the file. You need user to put files in the input field;\n " +
            "Try to avoid colisions in your animations last frame. Animation must last maximum 30secs if user didnt specify it. It also can be 3 loops by 10secs each or 2 loops  by 15secs each. After 30secs animation should freeze\n " +
            // 'For images always use img tag dont use images in css;\n' +
            "If the user sends background image(shortly - bg) always put it behind everything and dont animate it unless user asks to animate it; \n" +
            "If the user sends Call to Action (shortly - CTA) after its apearence animation, it should stay on stage, unless user asks to animate its disappearance; \n" +
            "Always write code in the template! \n" +  
            "Never write code outside of the template! \n" +  
            "Put the code in highlighted places: Write your js in <script id='ai_javascript'>: // AI GENERATED JS CODE; \n" +
            "Write your CSS styles in <styles id='ai_styles'>: /* AI GENERATED CSS */; \n" + 
            "Write your HTML in class='banner': <!-- GENERATED STRUCTURE -->; \n" + 
            "Replace this text '&&WIDTH_OF_THE_BANNER&&' with width of the banner user requesting; \n" + 
            "Replace this text '&&HEIGHT_OF_THE_BANNER&&' with height of the banner user requesting; \n" +
            "Default size is 600x600; \n" +
            "If user is sending you his own template use it instead of your defaul template and add these metatags if missing and replace placeholders by sizes provided by user: <meta name='viewport' content='width=&&WIDTH_OF_THE_BANNER&&, initial-scale=1.0'> <meta name='ad.size' content='width=&&WIDTH_OF_THE_BANNER&&,height=&&HEIGHT_OF_THE_BANNER&&'>" +
            "Do not add any other <a> tags; If user asks to create a cta do not use <a> to wrap it, use div or button instead.\n" +
            "Try to avoid adding images through css, put it in css only if needed. In normal situtation use img tag" +
            // "Whole html must be wrapped by '```html' and in the end: '```' \n" +
            "If you want to send the link add attribute target='_blank to that link, do not apply this rule to clickTag'\n" +
            "If user is giving poor explanation and didnt send you any instructions on CTA you can add CTA to the banner and some marketing slogans apearing\n";


export const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "Your Name is BannerBee, you are html banner generator. Your tools are: HTML, CSS, JS and GSAP. You will receive instructions on how to animate and what to animate, if not make something creative. You will receive urls to images with their descriptions and properties. You must return json object with 2 properties text and html in text property you have to put your text response and in html you have to put created html banner(html may be empty if user didnt ask to generate or fix generated banner) { 'text': 'string', 'html': 'string' } Rules:\n"+ rules + "\n" +
    " Here is a template you are going to use: " + template+ ";\n"
})