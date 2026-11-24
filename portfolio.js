const portfolio = {
  // About is shown as three boxes: welcome, intro, tech stack.
  welcome: "Welcome to my Frutiger Aero world, the world I wish to seek.",

  intro: {
    name: "Lattie Zhao",
    role: "Computer Science Student · Karlsruhe Institute of Technology (KIT)",
    // One row per fact: a short label and its text.
    facts: [
      { label: "Focus", text: "Embedded systems, edge AI / TinyML, computer architecture and large language models (LLMs)" },
      { label: "Interest", text: "Running LLMs on resource-constrained devices: quantization and compression, inference acceleration, and private on-device deployment" },
      { label: "Approach", text: "Building tools that solve my own problems, and understanding systems from the hardware up" },
      { label: "Currently", text: "Trying to build fun little tools with microcontrollers" },
      { label: "Open to", text: "Internships, student assistant (HiWi) positions and open-source collaboration" },
      { label: "This page", text: "A collection of my GitHub projects, as I learn from and contribute to open source" },
    ],
  },

  // Shown as the last About box. One row per group.
  stack: [
    { label: "Languages", items: ["Python", "C", "Java", "Go", "SQL", "Assembly"] },
    { label: "AI & LLM", items: ["PyTorch", "Ollama", "LLM APIs"] },
    { label: "Embedded", items: ["STM32", "ESP32", "Raspberry Pi", "Linux"] },
    { label: "Web & App", items: ["HTML", "CSS", "JavaScript", "Flutter"] },
    { label: "Tools", items: ["Git & GitHub", "Docker", "LaTeX", "Markdown"] },
  ],

  // Add one entry per project. Leave demo or repository empty to omit that link.
  projects: [
    {
      name: "Aero Garden",
      sticker: "globe",
      description: "An interactive Frutiger Aero homepage with a lakeside garden and a glass studio.",
      demo: "#garden",
      repository: "",
    },
    {
      name: "KIT Study Assistant",
      sticker: "computer",
      description: "A lightweight, self-hosted AI study assistant for KIT students: email digests, ILIAS deadlines, reminders and a Telegram bot.",
      demo: "",
      repository: "https://github.com/lattiezhao-a11y/kit-study-assistant",
    },
  ],
};
