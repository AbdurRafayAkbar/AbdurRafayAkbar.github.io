// Shared content for every demo. Projects are SAMPLE placeholders until real ones are added.
window.PROFILE = {
  name: "Abdur Rafay",
  title: "AI Agents & Automation Engineer",
  intro: "Hi, I'm Abdur Rafay. I build AI agents, automations and data pipelines that take repetitive work off your team's plate, and websites that actually talk to your visitors.",
  email: "hello@example.com",
  services: [
    { name: "AI agents & chatbots", desc: "Assistants that answer customers, qualify leads and use your tools, built on Claude and GPT." },
    { name: "Workflow automation", desc: "n8n, Make and Python automations that connect your email, CRM, sheets and inbox." },
    { name: "Data & ML engineering", desc: "Pipelines, dashboards and forecasting models that turn raw data into decisions." },
    { name: "AI-powered websites", desc: "Sites with voice, chat and interactive 3D that explain your business for you." }
  ],
  projects: [
    { name: "Lead-qualifying agent", tag: "Agent", result: "Replies to inbound leads in under 1 minute, books qualified calls", stack: "Claude API, n8n, HubSpot" },
    { name: "Invoice extraction pipeline", tag: "Automation", result: "Turns PDF invoices into clean spreadsheet rows, ~12 hrs/week saved", stack: "Python, OCR, Google Sheets" },
    { name: "Sales forecasting model", tag: "ML", result: "Weekly demand forecast for a retail catalog", stack: "pandas, scikit-learn, FastAPI" },
    { name: "Voice receptionist", tag: "Voice AI", result: "Answers calls, takes bookings after hours", stack: "Speech-to-text, LLM, Calendar API" }
  ],
  skills: ["Python", "Claude & OpenAI APIs", "LangGraph", "RAG & vector DBs", "n8n / Make", "FastAPI", "pandas", "scikit-learn", "SQL", "JavaScript", "Three.js"],
  qa: [
    { k: ["hi", "hello", "hey", "who"], a: "I'm Abdur Rafay's AI twin. Abdur builds AI agents, automations and data systems. Ask me about services, projects, skills or how to work together." },
    { k: ["service", "offer", "do you do", "sell", "help"], a: "Four things: AI agents and chatbots, workflow automation, data and ML engineering, and AI-powered websites like this one." },
    { k: ["project", "work", "portfolio", "built", "case"], a: "A few examples: a lead-qualifying agent, an invoice extraction pipeline, a sales forecasting model and a voice receptionist." },
    { k: ["skill", "stack", "tech", "tools", "language"], a: "Python, the Claude and OpenAI APIs, LangGraph, RAG with vector databases, n8n, FastAPI, pandas, scikit-learn, SQL and JavaScript." },
    { k: ["price", "cost", "rate", "budget", "charge"], a: "Most automations start as a small fixed-price pilot, so you see results before committing to more. Book a call and you'll get a quote within a day." },
    { k: ["hire", "job", "recruit", "cv", "resume", "available"], a: "Abdur is open to full-time roles and freelance projects in AI engineering. Ask for the CV or use the contact button." },
    { k: ["contact", "email", "call", "book", "reach"], a: "Email hello@example.com or use the 'Book a call' button. Replies within one working day." },
    { k: ["ml", "data", "model", "machine"], a: "On the data side: cleaning pipelines, dashboards, forecasting and classification models, deployed as simple APIs your team can use." },
    { k: ["agent", "automation", "n8n", "workflow"], a: "Agents read emails, fill CRMs, answer customers and hand off to a human when needed. Typical result: hours of manual work removed each week." }
  ],
  answer(q) {
    const t = (q || "").toLowerCase();
    const hit = this.qa.find(x => x.k.some(k => t.includes(k)));
    return hit ? hit.a : "Good question. In the full version I'll answer that with real AI. For now, try asking about services, projects, skills, pricing or hiring.";
  }
};
