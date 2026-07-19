import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini API if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini GenAI client successfully initialized on server.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined or is placeholder. AI Assistant will run in simulated mode.");
}

// Contacts log file for persistent storage
const CONTACTS_FILE = path.join(process.cwd(), "contacts_log.json");

// Helper to load logged contacts
function loadContacts() {
  if (fs.existsSync(CONTACTS_FILE)) {
    try {
      const data = fs.readFileSync(CONTACTS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Helper to save contacts
function saveContact(contact: any) {
  const contacts = loadContacts();
  contacts.push({
    ...contact,
    timestamp: new Date().toISOString(),
  });
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Retrieve logged contact submissions (useful for checking entries in the demo!)
app.get("/api/contacts", (req, res) => {
  const contacts = loadContacts();
  res.json({ success: true, count: contacts.length, data: contacts });
});

// API: Handle luxury contact form submission
app.post("/api/contact", (req, res) => {
  const { name, email, phone, business, budget, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Please provide a name and email address so Rabbia can respond to your consultation.",
    });
  }

  const newSubmission = { name, email, phone, business, budget, message };
  saveContact(newSubmission);

  return res.json({
    success: true,
    message: `Thank you, ${name}! Your consultation request was successfully locked in. Rabbia Waqas or a senior strategist will contact you within 24 hours regarding your ${budget || "general"} budget growth plan.`,
  });
});

// API: AI Marketing Assistant Proxy using correct @google/genai SDK
app.post("/api/ai-chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Prompt message is required." });
  }

  const systemInstruction = `
You are Rabbia Waqas's Elite AI Marketing Strategist & Agency Assistant.
You represent Rabbia Waqas, an expert Digital Marketing Strategist and Meta Ads Specialist with 4+ years of experience helping brands scale with data-driven marketing.
Your voice is: highly professional, elegant, expert, strategic, luxury-focused, and confident.
Never say you are an AI model from Google or use clinical developer terms. You are Rabbia's digital strategist.

RABBIA WAQAS'S CRITICAL CONTEXT:
- Experience:
  1. Strategy Manager at BUYHUB (April 2024 - Present): Slashed cost-per-lead (CPL) by 30%, boosted qualified leads by 60%, improved organic engagement by 45%, set up A/B testing Frameworks yielding +25% CTR. Managed PKR 2M+ ad budgets.
  2. Marketing Manager at Whisper (Dec 2023 - April 2024): grew followers organically on IG by 35% in 4 months, negotiated key micro/macro influencer collaborations, boosted sales by 40%.
  3. Freelance Consultant (2022 - 2023): managed 8+ active brands across food & beverage, luxury fashion, real estate, and perfume industries.
- Education: Bachelor of Arts (BA) in Art & Visual Studies from University of the Punjab. This background gives her a unique advantage in creative copy development, high-end visual design on Canva, and scroll-stopping digital layouts.
- Certifications: Meta Certified Blueprint Specialist, Google Analytics Academy, HubSpot Social Media & Content Marketing, Google Digital Garage.
- Skills: Meta Ads (Facebook & Instagram), Audience Targeting Segmentation, Funnel Building, Landing Page UX, Campaign Analytics, Canva Design, Copywriting.
- Contact Details: Email: rabbiawaqas04@gmail.com, Phone: +92-323-8491574, Location: Lahore, Pakistan.

YOUR TASK:
- Answer client questions about digital marketing, Meta Ads setups, CPL reduction, lead generation, branding, or influencer strategies with actionable, high-end advice.
- Refer to Rabbia's real experience (e.g., at BUYHUB, Whisper, or her freelance portfolio) to validate your strategies.
- Use Lahore / Pakistan localized context if they ask about Pakistani market channels, but speak with global standards.
- Actively encourage them to book a custom 1-on-1 growth consultation with Rabbia Waqas using the budget contact form on the portfolio website!
- Format your response beautifully using bold headers, bullet points, or clean paragraph spacing.
`;

  // Fallback if AI SDK is not initialized due to missing keys
  if (!ai) {
    console.log("Using simulated assistant response due to missing GEMINI_API_KEY.");
    // Simulate a high-quality strategic response
    setTimeout(() => {
      let simResponse = "";
      const msgLower = message.toLowerCase();
      if (msgLower.includes("lead") || msgLower.includes("real estate") || msgLower.includes("buyhub")) {
        simResponse = `### Direct Lead Acquisition Framework

Based on our successful scaling project at **BUYHUB**, here is a 3-tier strategy we can deploy for your brand immediately:

1. **High-Value Gating**: We will introduce 2 custom qualifications to filter out casual clicks and double lead relevance.
2. **Dynamic Video Walkthroughs**: We will use 15-20s scroll-stopping immersive walkthroughs of your listings to capture attention.
3. **Lookalike Funnels**: Utilizing Meta's pixel database to build a 1% lookalike bracket centered on high-net-worth buyers.

At BUYHUB, this exact framework successfully scaled leads by **60%** while cutting cost-per-lead (CPL) by **30%**! 

*Would you like to book a 1-on-1 strategy session with Rabbia to implement this? Please fill out the budget consultation form below!*`;
      } else if (msgLower.includes("perfume") || msgLower.includes("ecommerce") || msgLower.includes("whisper") || msgLower.includes("fashion")) {
        simResponse = `### Luxury E-Commerce Scaling Strategy

For high-end e-commerce brands like **Whisper Luxury Perfumes**, we avoid standard broad-interest ads. Instead, we implement an organic-paid trust hybrid:

* **Influencer Whitelisting**: Negotiating with aesthetic lifestyle creators and running conversion-driven catalog ads directly from their profiles.
* **Retargeting Loops**: Retargeting anyone who engages with our visual storytelling and Canva assets with exclusive bottom-of-funnel checkout incentives.
* **Advantage+ Shopping Catalogues**: Dynamically presenting the exact fragrance or fashion item matching their specific visual interests.

This exact pipeline generated a **40% increase in direct sales** and a **35% follower growth** for Whisper in just 4 months.

*We can audit your existing checkout funnel. Would you like to map out a scaling route for your brand? Provide your details in our budget form!*`;
      } else {
        simResponse = `### Customized Brand Growth Blueprint

Thank you for reaching out! To scale your marketing successfully, Rabbia Waqas focuses on three core pillars:

1. **Aesthetic Creativity**: Leveraging her visual arts expertise (BA in Art & Visual Studies) to build premium ad graphics and scroll-stopping visual copies.
2. **Pixel-Perfect Optimization**: Implementing rigorous A/B testing of hooks, copy, and creative formats to increase your click-through rates (CTR) by up to **25%**.
3. **Full-Funnel Meta Ads**: Crafting campaigns from brand awareness to retargeting with PK 2M+ ad budget expertise.

*I highly recommend booking a dedicated 1-on-1 digital audit. Please fill out the budget consultation form below, or click the gold 'Let's Grow Your Brand' button!*`;
      }
      return res.json({ success: true, text: simResponse });
    }, 1000);
    return;
  }

  try {
    // Format conversation history for Gemini API
    // Ensure contents are in the correct shape for generateContent
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      success: false,
      error: "There was an issue processing your strategic consultation request. Please try again or reach out to Rabbia directly.",
    });
  }
});

// Vite middleware integration for full-stack build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rabbia Waqas Portfolio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
