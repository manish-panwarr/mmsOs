/**
 * PORTFOLIO-DATA.JS — Single Source of Truth for Portfolio Content
 * Structured configuration for Hero, Bio, Projects, Education, Services, and Terminal commands.
 */

export const GITHUB_USER = 'manish-panwarr';
export const LEETCODE_USER = 'g7pE7qxNks';
export const LEETCODE_API = '/api/leetcode';
export const PORTFOLIO_URL = 'https://mmsingh.me/';

export const PROFILE_DATA = {
  name: 'Manish Mohan Singh',
  role: 'Full Stack Engineer',
  specialization: 'MERN &bull; Generative AI Integrations &bull; Cloud Systems',
  status: 'Available for Full-Time & High-Impact Roles',
  location: 'Chamiyala, Uttarakhand, India',
  email: 'panwarmanish0123@gmail.com',
  phone: '+91 9027811529',
  aboutLines: [
    'Full Stack Engineer architecting resilient web applications with React, Node.js, Express, and MongoDB.',
    'Specializes in low-latency generative AI integration, token streaming pipelines, and microservice APIs.',
    'Passionate about performance optimization, clean design ergonomics, and disciplined algorithmic problem solving.'
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/manish-panwarr', symbol: 'icon-github' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/manish-mohan-singh-aab371374/', symbol: 'icon-linkedin' },
    { label: 'Email', url: 'mailto:panwarmanish0123@gmail.com', symbol: 'icon-envelope' },
    { label: 'Phone', url: 'tel:+919027811529', symbol: 'icon-doc-text' }
  ],
  stats: [
    { num: '150+', label: 'LeetCode Solved', targetWindow: 'skills' },
    { num: '200+', label: 'Days Active Streak', targetWindow: 'skills' },
    { num: '10+', label: 'Full Stack Projects', targetWindow: 'projects' },
    { num: '8+', label: 'Verified Credentials', targetWindow: 'certificates' }
  ]
};

export const PROJECTS_DATA = [
  {
    id: 'ai-chat',
    title: 'AI Conversational Agent',
    category: 'ai mern',
    desc: 'Production-grade chat workspace integrating Google Gemini with streaming tokens, session memory, and auth.',
    stack: ['React', 'Node.js', 'Express', 'Gemini API', 'MongoDB'],
    image: 'images/ai-chat-app.png',
    github: 'https://github.com/manish-panwarr',
    live: 'https://mms.dev/'
  },
  {
    id: 'procastinot',
    title: 'ProcastiNot Task Suite',
    category: 'mern',
    desc: 'Gamified productivity system featuring an Eisenhower priority matrix, custom Pomodoro intervals, and streak incentives.',
    stack: ['React', 'Express', 'Node.js', 'Tailwind', 'MongoDB'],
    image: 'images/procastinot.png',
    github: 'https://github.com/manish-panwarr',
    live: 'https://mms.dev/'
  },
  {
    id: 'phishing-shield',
    title: 'Phishing Shield Inspector',
    category: 'security',
    desc: 'Heuristic domain security scanner evaluating URLs for malicious patterns, WHOIS age, and SSL certification.',
    stack: ['JavaScript', 'Python API', 'Security Heuristics', 'REST'],
    image: 'images/phising-site.png',
    github: 'https://github.com/manish-panwarr',
    live: 'https://mms.dev/'
  },
  {
    id: 'rentease',
    title: 'RentEase Marketplace',
    category: 'mern',
    desc: 'Property rental marketplace offering geospatial search, dynamic filters, image uploads, and landlord inquiry routing.',
    stack: ['React', 'Node.js', 'MongoDB', 'Cloudinary', 'Express'],
    image: 'images/mcreation_bg.jpeg',
    github: 'https://github.com/manish-panwarr',
    live: 'https://mms.dev/'
  }
];

export const SERVICES_DATA = [
  {
    title: 'Full-Stack Web Development',
    symbol: 'icon-folder',
    desc: 'End-to-end SPAs and server-rendered web platforms built with React, Node.js, Express, and MongoDB.',
    bullets: ['Single Page Applications (SPA)', 'Responsive & Mobile-First UIs', 'Component Design Systems']
  },
  {
    title: 'AI & Automation Integration',
    symbol: 'icon-cpu',
    desc: 'Injecting modern LLMs and generative agents into user flows with low-latency streaming completions.',
    bullets: ['OpenAI & Gemini API Orchestration', 'Real-time Streaming Interfaces', 'Automated Workflow Pipelines']
  },
  {
    title: 'REST & Backend API Architecture',
    symbol: 'icon-terminal',
    desc: 'Scalable server microservices with JWT auth, rate limiting, granular validation, and mongo indexes.',
    bullets: ['Scalable Express / Node.js Backends', 'Database Modeling & Index Optimization', 'Defensible API Architecture']
  },
  {
    title: 'DevOps & Containerization',
    symbol: 'icon-briefcase',
    desc: 'Dockerized environments, automated build pipelines, and production deployments across cloud hosts.',
    bullets: ['Docker Containerization', 'Git Workflows & CI/CD Pipelines', 'Cloud Hosting & Domain Setup']
  },
  {
    title: 'Performance & SEO Optimization',
    symbol: 'icon-rosette',
    desc: 'Auditing Core Web Vitals to achieve 95+ Lighthouse scores: code-splitting, zero CLS, and asset pipelines.',
    bullets: ['60fps GPU Hardware Acceleration', 'Zero Layout Shifts (CLS)', 'Structured Schema & Rich Snippets']
  },
  {
    title: 'Defensible Web Security',
    symbol: 'icon-doc-text',
    desc: 'Securing web applications following OWASP guidelines: sanitize inputs, prevent XSS/CSRF, and secure cookies.',
    bullets: ['HTTP-Only Cookies & Granular JWT', 'CORS Policies & Input Sanitization', 'SSL Headers & Rate Limiting']
  }
];

export const EDUCATION_DATA = [
  {
    degree: 'Master of Computer Applications (MCA)',
    institute: 'Graphic Era Hill University, Dehradun',
    years: '2024 – 2026',
    status: 'In Progress',
    score: 'First Division',
    desc: 'Advanced study in Cloud Computing, Distributed Web Systems, Algorithms, and Generative AI.',
    focusChips: ['Advanced DSA', 'Cloud Systems', 'Distributed Computing', 'Machine Learning']
  },
  {
    degree: 'Bachelor of Computer Applications (BCA)',
    institute: 'Graphic Era Hill University, Dehradun',
    years: '2021 – 2024',
    status: 'Completed',
    score: 'CGPA 8.6 / 10',
    desc: 'Comprehensive grounding in Object-Oriented Programming, Relational Databases, and Operating Systems.',
    focusChips: ['Data Structures & OOP', 'Database Systems (RDBMS)', 'Operating Systems', 'Web Fundamentals']
  },
  {
    degree: 'Higher Secondary School (Class XII)',
    institute: 'Uttarakhand State Board',
    years: '2020 – 2021',
    status: 'Completed',
    score: 'First Division',
    desc: 'Science stream with focus on Physics, Chemistry, and Advanced Mathematics.',
    focusChips: ['Mathematics', 'Physics', 'Computer Science']
  },
  {
    degree: 'Secondary School (Class X)',
    institute: 'Uttarakhand State Board',
    years: '2018 – 2019',
    status: 'Completed',
    score: 'Distinction',
    desc: 'General Science, Mathematics, English, and Social Studies.',
    focusChips: ['Mathematics', 'General Science', 'Logical Reasoning']
  }
];

export const SKILLS_DATA = {
  frontend: ['React.js', 'Next.js', 'JavaScript (ES6+)', 'TypeScript', 'HTML5 & CSS3', 'Tailwind CSS', 'Redux / Zustand', 'Web Accessibility (a11y)'],
  backend: ['Node.js', 'Express.js', 'RESTful APIs', 'Python', 'JWT Authentication', 'WebSockets', 'Microservices'],
  database: ['MongoDB', 'Mongoose ODM', 'MySQL', 'PostgreSQL', 'Redis Basics', 'Query Optimization'],
  tools: ['Docker', 'Git & GitHub', 'Postman', 'Linux CLI', 'AWS Basics (EC2/S3)', 'Vite', 'Webpack']
};
