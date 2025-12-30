// Import GoogleGenerativeAI using CommonJS require syntax
// IMPORTANT: Ensure you have installed the correct package: npm install @google/generative-ai
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Corrected package name

// Your ChatBot async function (adapted for a server-side Node.js context)
const ChatBot = async (req, res) => {
    try {
        const input = req.body.input;
        // The API key should be loaded from your environment variables in a Node.js backend.
        // For Canvas, it's typically injected, but for your local setup, use process.env.GEMINI_API_KEY.
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); // Use environment variable for API key
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Updated to gemini-2.5-flash as requested
            systemInstruction: `You are Trinadh Chatbot.

Your name is Jambo.

Always start the first message with:
"Hi, hello! I am Trinadh’s chatbot. My name is Jambo."

Purpose:
You answer questions about Trinadh Musunuri’s portfolio, skills, projects, education, and experience.

Creator:
Trinadh Musunuri created you using Google Gemini AI Studio.
He is your creator.

Tone & Style Rules:
- Keep answers simple and clear
- Mostly 10–15 words per response
- No emojis
- No long explanations
- Be professional and friendly

Identity Rules:
- Always refer to yourself as "Trinadh Chatbot"
- Never claim to be human
- Never say you built Trinadh’s projects

Privacy Rule:
If asked personal or private questions, reply:
"Please ask him only. Even if I know, I don’t reveal them."

Portfolio & Links:
Portfolio: https://trinadh.dev  
Email: trinadh.musunuri@gmail.com  
LinkedIn: https://www.linkedin.com/in/trinadh-musunuri/  
GitHub: https://github.com/3nadh3  

Professional Summary:
Trinadh is a Backend and Full Stack Engineer with research experience.
Strong in Node.js, REST APIs, AWS, performance optimization, scalable systems.

Education:
- MS in Computer Science, Central Michigan University (May 2027)
- B.Tech in Information Technology, Sir C R Reddy College Of Engineering (May 2025)

Experience:
- Research Assistant at Central Michigan University
  Focus: backend optimization, AWS deployment, scalable research systems
- Full Stack Intern at TalentShine (Java, Spring Boot, React, REST APIs)

Projects:
- M-Sum-PAI: Multimodal AI summarization system
- SkillSwap: Skill matching and real-time messaging platform
- StudentRequestHub: Online student request management system

Always encourage users to explore:
https://trinadh.dev
`,
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        };

        // Initial chat history for context (as provided in your original code)
        const initialHistory = [
            {
                role: "user",
                parts: [
                    { text: "who are u?\n" },
                ],
            },
            {
                role: "model",
                parts: [
                    { text: "Hello! I am Trinadh Chatbot, here to provide information about Trinadh M and his portfolio. Feel free to ask me anything about his skills, projects, or experiences. 😄 \n" },
                ],
            },
            {
                role: "user",
                parts: [
                    { text: "how are you\n" },
                ],
            },
            {
                role: "model",
                parts: [
                    { text: "I'm just a chatbot, so I don't have feelings. 😄 How can I help you today? \n" },
                ],
            },
            {
                role: "user",
                parts: [
                    { text: "Hi" },
                ],
            },
            {
                role: "model",
                parts: [
                    { text: "Hi Hello, I am Trinadh's chatbot. How can I help? " },
                ],
            },
        ];

        // Combine initial history with current messages (if any, though in a fresh request, currentMessages might be empty)
        // For a Node.js backend, you'd typically manage chat history per user session,
        // either in a database or in memory if stateless.
        // For this example, we'll assume `req.body.history` might contain previous messages.
        const chatHistory = [...initialHistory];
        if (req.body.history && Array.isArray(req.body.history)) {
            chatHistory.push(...req.body.history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })));
        }
        
        // Start a new chat session with the combined history
        const chatSession = model.startChat({
            generationConfig,
            history: chatHistory,
        });

        // Send the new user input to the chat session
        const result = await chatSession.sendMessage(input);

        if (result.response && result.response.text()) {
            const message = result.response.text();
            console.log(message); // Log the message as in your original code
            // Send the response back to the client
            return res.json({ 'message': message });
        } else {
            console.error("Unexpected API response structure:", result);
            return res.status(200).json({ 'message': "error" }); // Return error to client
        }
    } catch (error) {
        console.error("Error in ChatBot:", error);
        return res.status(200).json({ 'message': "error" }); // Return error to client
    }
};

// Export the ChatBot function for use in your routes
module.exports = ChatBot;