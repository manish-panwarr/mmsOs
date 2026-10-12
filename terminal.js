/**
 * TERMINAL.JS — macOS Terminal.app Simulator (zsh 80x24)
 * Live-coding boot sequence, interactive command parser, history, tab-completion,
 * DOM node sanitation, keyboard shortcuts, and accessibility.
 */

import {
  PROFILE_DATA,
  PROJECTS_DATA,
  SERVICES_DATA,
  EDUCATION_DATA,
  SKILLS_DATA,
  PORTFOLIO_URL
} from './portfolio-data.js';
import { windowManager } from './macos-enhancements.js';

class TerminalController {
  constructor() {
    this.terminalWin = null;
    this.bodyEl = null;
    this.inputEl = null;
    this.cursorEl = null;
    this.hasBooted = false;
    this.isBooting = false;
    this.skipBoot = false;

    // Command History & Autocomplete
    this.history = [];
    this.historyIdx = -1;
    this.availableCommands = [
      'help',
      'projects',
      'services',
      'education',
      'skills',
      'email',
      'phone',
      'resume',
      'contact',
      'whoami',
      'theme',
      'leetcode',
      'portfolio',
      'clear'
    ];
    this._userScrolledUp = false;
  }

  init() {
    this.terminalWin = document.getElementById('win-terminal');
    this.bodyEl = document.getElementById('terminal-body');
    this.inputEl = document.getElementById('terminal-cli-input');
    this.cursorEl = document.querySelector('.terminal-block-cursor');

    if (!this.terminalWin || !this.bodyEl || !this.inputEl) return;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('windowActivated', (e) => {
      if (e.detail?.id === 'terminal') {
        this.onTerminalOpen();
      }
    });

    // Input key handling (Enter, Tab, Up, Down, Ctrl+L, Ctrl+C)
    this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Focus input when terminal window is clicked or focused
    this.terminalWin.addEventListener('click', (e) => {
      // If user clicks a clickable command button, run it
      const cmdBtn = e.target.closest('[data-term-cmd]');
      if (cmdBtn) {
        const cmd = cmdBtn.getAttribute('data-term-cmd');
        if (cmd) {
          this.executeCommand(cmd);
          this.inputEl.focus();
          return;
        }
      }

      // If user clicks terminal body during boot, skip boot
      if (this.isBooting) {
        this.skipBoot = true;
      }

      // If text isn't selected, focus input
      if (!window.getSelection()?.toString()) {
        this.inputEl.focus();
      }
    });

    // Skip boot on any keypress during boot
    window.addEventListener('keydown', () => {
      if (this.isBooting) {
        this.skipBoot = true;
      }
    });

    // Mobile shortcut command chips
    document.querySelectorAll('.term-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          this.executeCommand(cmd);
          this.inputEl.focus();
        }
      });
    });

    // Keep block cursor in sync with real input
    this.inputEl.addEventListener('input', () => {
      this.updateCursorPosition();
    });

    // Mobile on-screen keyboard handling via visualViewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (this.terminalWin?.classList.contains('active')) {
          this.scrollToBottom();
          this.inputEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    }

    // Detect when user scrolls up — suspend auto-scroll until new command
    const scrollEl = document.getElementById('terminal-output-scroll');
    if (scrollEl) {
      scrollEl.addEventListener('scroll', () => {
        const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
        this._userScrolledUp = distFromBottom > 60;
      }, { passive: true });
    }
  }

  updateCursorPosition() {
    // Input is transparently positioned with block cursor blinking next to text
    this.scrollToBottom();
  }

  onTerminalOpen() {
    if (!this.hasBooted) {
      this.hasBooted = true;
      this.startBootSequence();
    } else {
      setTimeout(() => this.inputEl?.focus(), 100);
    }
  }

  /* ------------------------------------------------------------------------
     Boot Sequence: Live-coding char-by-char at ~18ms with jitter
     ------------------------------------------------------------------------ */
  async startBootSequence() {
    this.isBooting = true;
    this.skipBoot = false;
    this.inputEl.disabled = true;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      this.skipBoot = true;
    }

    const bannerText = [
      '  __  __ __  __ ____       _             ',
      ' |  \\/  |  \\/  / ___|   __| | _____   __ ',
      ' | |\\/| | |\\/| \\___ \\  / _` |/ _ \\ \\ / / ',
      ' | |  | | |  | |___) || (_| |  __/\\ V /  ',
      ' |_|  |_|_|  |_|____/(_)__,_|\\___| \\_/   '
    ].join('\n');

    // 1. ASCII Banner
    const bannerEl = document.createElement('pre');
    bannerEl.className = 'term-banner';
    bannerEl.textContent = bannerText;
    this.bodyEl.appendChild(bannerEl);

    // 2. Greeting
    await this.typeLine('visitor@mmsdev ~ % ./boot_profile.sh', 'term-cmd-echo');
    await this.sleep(120);

    // 3. System greeting & metadata
    await this.typeLine(`[SYSTEM] Initializing mOS Darwin kernel v24.2.0 (x86_64)`, 'term-system');
    await this.typeLine(`[PROFILE] Name: ${PROFILE_DATA.name} | Role: ${PROFILE_DATA.role}`, 'term-info');
    await this.typeLine(`[STATUS]  ${PROFILE_DATA.status}`, 'term-success');
    await this.typeLine(`[STACK]   React, Node.js, Express, MongoDB, Python, Generative AI`, 'term-info');
    await this.typeLine(`[DSA]     150+ LeetCode algorithmic solutions verified`, 'term-info');
    await this.sleep(100);

    // 4. Fade in available commands block with clickable action buttons
    this.renderAvailableCommandsBlock();

    this.isBooting = false;
    this.inputEl.disabled = false;
    this.inputEl.focus();
    this.scrollToBottom();
  }

  renderAvailableCommandsBlock() {
    const wrap = document.createElement('div');
    wrap.className = 'term-welcome-box';

    const title = document.createElement('div');
    title.className = 'term-welcome-title';
    title.textContent = '🚀 Terminal is interactive. Click a command below or type directly:';
    wrap.appendChild(title);

    const btnGrid = document.createElement('div');
    btnGrid.className = 'term-clickable-cmds';

    this.availableCommands.forEach((cmd) => {
      const btn = document.createElement('button');
      btn.className = 'term-cmd-btn';
      btn.setAttribute('data-term-cmd', cmd);
      btn.textContent = cmd;
      btnGrid.appendChild(btn);
    });

    wrap.appendChild(btnGrid);
    this.bodyEl.appendChild(wrap);
  }

  async typeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    this.bodyEl.appendChild(line);

    if (this.skipBoot) {
      line.textContent = text;
      this.scrollToBottom();
      return;
    }

    for (let i = 0; i < text.length; i++) {
      if (this.skipBoot) {
        line.textContent = text;
        this.scrollToBottom();
        return;
      }
      // Wait only if the terminal window is not active (not win-contact — that was a bug)
      while (document.hidden || !document.getElementById('win-terminal')?.classList.contains('active')) {
        await this.sleep(80);
      }
      line.textContent += text[i];
      this.scrollToBottom();
      // ~18ms with jitter
      const jitter = 10 + Math.random() * 16;
      await this.sleep(jitter);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ------------------------------------------------------------------------
     Command Handling & Sanitization
     ------------------------------------------------------------------------ */
  handleKeyDown(e) {
    if (this.isBooting) {
      this.skipBoot = true;
      return;
    }

    // Enter: Execute
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = this.inputEl.value.trim();
      this.inputEl.value = '';
      if (val) {
        this.history.push(val);
        this.historyIdx = this.history.length;
        this.executeCommand(val);
      } else {
        this.printPromptLine('');
      }
      return;
    }

    // Up Arrow: History backward
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length > 0 && this.historyIdx > 0) {
        this.historyIdx--;
        this.inputEl.value = this.history[this.historyIdx] || '';
      }
      return;
    }

    // Down Arrow: History forward
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIdx < this.history.length - 1) {
        this.historyIdx++;
        this.inputEl.value = this.history[this.historyIdx] || '';
      } else {
        this.historyIdx = this.history.length;
        this.inputEl.value = '';
      }
      return;
    }

    // Tab: Autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      const raw = this.inputEl.value.trim().toLowerCase();
      const clean = raw.replace(/^@mmsdev:/, '');
      const match = this.availableCommands.find((c) => c.startsWith(clean));
      if (match) {
        this.inputEl.value = raw.startsWith('@mmsdev:') ? `@mmsdev:${match}` : match;
      }
      return;
    }

    // Ctrl+L: Clear terminal
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      this.clearTerminal();
      return;
    }

    // Ctrl+C: Cancel typing
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.printPromptLine(this.inputEl.value + ' ^C');
      this.inputEl.value = '';
      return;
    }
  }

  printPromptLine(cmdText) {
    const line = document.createElement('div');
    line.className = 'term-line';

    const promptSpan = document.createElement('span');
    promptSpan.className = 'term-prompt-tag';
    promptSpan.textContent = 'visitor@mmsdev ~ % ';

    const cmdSpan = document.createElement('span');
    cmdSpan.className = 'term-cmd-text';
    cmdSpan.textContent = cmdText;

    line.appendChild(promptSpan);
    line.appendChild(cmdSpan);
    this.bodyEl.appendChild(line);
    this.scrollToBottom();
  }

  executeCommand(rawInput) {
    const sanitized = rawInput.trim();
    this._userScrolledUp = false; // Resume auto-scroll on new command
    this.printPromptLine(sanitized);

    // Normalize command (accept projects or @mmsdev:projects)
    const normalized = sanitized.toLowerCase().replace(/^@mmsdev:/, '');

    switch (normalized) {
      case 'help':
        this.cmdHelp();
        break;
      case 'projects':
        this.cmdProjects();
        break;
      case 'services':
        this.cmdServices();
        break;
      case 'education':
        this.cmdEducation();
        break;
      case 'skills':
        this.cmdSkills();
        break;
      case 'email':
        this.cmdEmail();
        break;
      case 'phone':
        this.cmdPhone();
        break;
      case 'resume':
        this.cmdResume();
        break;
      case 'contact':
        this.cmdContact();
        break;
      case 'whoami':
        this.cmdWhoami();
        break;
      case 'theme':
        this.cmdTheme();
        break;
      case 'leetcode':
        this.cmdLeetcode();
        break;
      case 'portfolio':
        this.cmdPortfolio();
        break;
      case 'clear':
        this.clearTerminal();
        break;
      default:
        this.cmdNotFound(sanitized);
        break;
    }

    this.scrollToBottom();
  }

  /* ------------------------------------------------------------------------
     Command Implementations
     ------------------------------------------------------------------------ */
  cmdHelp() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const title = document.createElement('div');
    title.className = 'term-heading';
    title.textContent = 'Available Commands (accepts standard or @mmsdev: prefix):';
    out.appendChild(title);

    const helpMap = [
      { cmd: 'projects', desc: 'List featured full-stack projects with stack and links' },
      { cmd: 'services', desc: 'List engineering solutions & capabilities' },
      { cmd: 'education', desc: 'Display academic background and degree timeline' },
      { cmd: 'skills', desc: 'Display technical competence across Frontend, Backend & Tools' },
      { cmd: 'email', desc: 'Show official email with instant copy button' },
      { cmd: 'phone', desc: 'Show phone number with direct dial and copy' },
      { cmd: 'resume', desc: 'Launch and focus the full Curriculum Vitae window' },
      { cmd: 'portfolio', desc: 'Open mmsingh.me live website preview window' },
      { cmd: 'contact', desc: 'Open the Contact transmission window' },
      { cmd: 'whoami', desc: 'Print verified profile identity' },
      { cmd: 'theme', desc: 'Toggle system light and dark frosted glass modes' },
      { cmd: 'clear', desc: 'Clear the terminal output screen (or Ctrl+L)' }
    ];

    helpMap.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'term-help-row';

      const cmdSpan = document.createElement('span');
      cmdSpan.className = 'term-help-cmd';
      cmdSpan.textContent = `@mmsdev:${item.cmd.padEnd(10)}`;

      const descSpan = document.createElement('span');
      descSpan.className = 'term-help-desc';
      descSpan.textContent = item.desc;

      row.appendChild(cmdSpan);
      row.appendChild(descSpan);
      out.appendChild(row);
    });

    this.bodyEl.appendChild(out);
  }

  cmdProjects() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const heading = document.createElement('div');
    heading.className = 'term-heading';
    heading.textContent = 'Featured Engineering Projects:';
    out.appendChild(heading);

    PROJECTS_DATA.forEach((p, i) => {
      const item = document.createElement('div');
      item.className = 'term-item-card';

      const title = document.createElement('div');
      title.className = 'term-card-title';
      title.textContent = `${i + 1}. ${p.title}`;

      const desc = document.createElement('div');
      desc.className = 'term-card-desc';
      desc.textContent = p.desc;

      const stack = document.createElement('div');
      stack.className = 'term-card-stack';
      stack.textContent = `Stack: [${p.stack.join(', ')}]`;

      const links = document.createElement('div');
      links.className = 'term-card-links';

      const ghLink = document.createElement('a');
      ghLink.href = p.github;
      ghLink.target = '_blank';
      ghLink.rel = 'noopener noreferrer';
      ghLink.className = 'term-link';
      ghLink.textContent = 'GitHub';

      const liveLink = document.createElement('a');
      liveLink.href = p.live;
      liveLink.target = '_blank';
      liveLink.rel = 'noopener noreferrer';
      liveLink.className = 'term-link';
      liveLink.textContent = 'Live Demo';

      links.appendChild(ghLink);
      links.appendChild(document.createTextNode(' | '));
      links.appendChild(liveLink);

      item.appendChild(title);
      item.appendChild(desc);
      item.appendChild(stack);
      item.appendChild(links);
      out.appendChild(item);
    });

    this.bodyEl.appendChild(out);
  }

  cmdServices() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const heading = document.createElement('div');
    heading.className = 'term-heading';
    heading.textContent = 'Engineering Capabilities & Solutions:';
    out.appendChild(heading);

    SERVICES_DATA.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'term-service-item';

      const title = document.createElement('div');
      title.className = 'term-card-title';
      title.textContent = `${idx + 1}. ${s.title}`;

      const desc = document.createElement('div');
      desc.className = 'term-card-desc';
      desc.textContent = s.desc;

      const bullets = document.createElement('ul');
      bullets.className = 'term-bullets';
      s.bullets.forEach((b) => {
        const li = document.createElement('li');
        li.textContent = b;
        bullets.appendChild(li);
      });

      item.appendChild(title);
      item.appendChild(desc);
      item.appendChild(bullets);
      out.appendChild(item);
    });

    this.bodyEl.appendChild(out);
  }

  cmdEducation() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const heading = document.createElement('div');
    heading.className = 'term-heading';
    heading.textContent = 'Academic Credentials & Timeline:';
    out.appendChild(heading);

    EDUCATION_DATA.forEach((e) => {
      const row = document.createElement('div');
      row.className = 'term-item-card';

      const deg = document.createElement('div');
      deg.className = 'term-card-title';
      deg.textContent = `${e.degree} (${e.years})`;

      const inst = document.createElement('div');
      inst.className = 'term-card-desc';
      inst.textContent = `${e.institute} — Score: ${e.score} [${e.status}]`;

      const focus = document.createElement('div');
      focus.className = 'term-card-stack';
      focus.textContent = `Focus: ${e.focusChips.join(', ')}`;

      row.appendChild(deg);
      row.appendChild(inst);
      row.appendChild(focus);
      out.appendChild(row);
    });

    this.bodyEl.appendChild(out);
  }

  cmdSkills() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const heading = document.createElement('div');
    heading.className = 'term-heading';
    heading.textContent = 'Technical Competence Matrix:';
    out.appendChild(heading);

    const categories = [
      { name: 'Frontend', list: SKILLS_DATA.frontend },
      { name: 'Backend', list: SKILLS_DATA.backend },
      { name: 'Databases', list: SKILLS_DATA.database },
      { name: 'DevOps & Tools', list: SKILLS_DATA.tools }
    ];

    categories.forEach((cat) => {
      const group = document.createElement('div');
      group.className = 'term-skills-group';

      const title = document.createElement('strong');
      title.className = 'term-skills-cat';
      title.textContent = `${cat.name}: `;

      const chips = document.createElement('span');
      chips.className = 'term-skills-list';
      chips.textContent = cat.list.join(' • ');

      group.appendChild(title);
      group.appendChild(chips);
      out.appendChild(group);
    });

    this.bodyEl.appendChild(out);
  }

  cmdEmail() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const mail = 'panwarmanish013@gmail.com';
    const note = document.createElement('div');
    note.className = 'term-card-desc';
    note.textContent = 'Reach out directly for opportunities or technical queries. I reply within 24h:';

    const linkRow = document.createElement('div');
    linkRow.className = 'term-contact-row';

    const mailLink = document.createElement('a');
    mailLink.href = `mailto:${mail}`;
    mailLink.className = 'term-contact-link';
    mailLink.textContent = mail;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'term-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(mail);
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      } catch {
        window.location.href = `mailto:${mail}`;
      }
    });

    linkRow.appendChild(mailLink);
    linkRow.appendChild(copyBtn);

    out.appendChild(note);
    out.appendChild(linkRow);
    this.bodyEl.appendChild(out);
  }

  cmdPhone() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const phone = '+91 9027811529';
    const cleanPhone = '+919027811529';

    const note = document.createElement('div');
    note.className = 'term-card-desc';
    note.textContent = 'Feel free to connect or message on WhatsApp/Phone:';

    const linkRow = document.createElement('div');
    linkRow.className = 'term-contact-row';

    const telLink = document.createElement('a');
    telLink.href = `tel:${cleanPhone}`;
    telLink.className = 'term-contact-link';
    telLink.textContent = phone;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'term-copy-btn';
    copyBtn.textContent = 'Copy Phone';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cleanPhone);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Phone'; }, 2000);
      } catch {
        window.location.href = `tel:${cleanPhone}`;
      }
    });

    linkRow.appendChild(telLink);
    linkRow.appendChild(copyBtn);

    out.appendChild(note);
    out.appendChild(linkRow);
    this.bodyEl.appendChild(out);
  }

  cmdResume() {
    const line = document.createElement('div');
    line.className = 'term-success';
    line.textContent = 'Opening Curriculum Vitae window...';
    this.bodyEl.appendChild(line);
    windowManager.openWindow('resume');
  }

  cmdContact() {
    const line = document.createElement('div');
    line.className = 'term-success';
    line.textContent = 'Opening Contact window...';
    this.bodyEl.appendChild(line);
    windowManager.openWindow('contact');
  }

  cmdLeetcode() {
    const line = document.createElement('div');
    line.className = 'term-success';
    line.textContent = 'Opening Skills & LeetCode window...';
    this.bodyEl.appendChild(line);
    windowManager.openWindow('skills');
  }

  cmdPortfolio() {
    const line = document.createElement('div');
    line.className = 'term-success';
    line.textContent = 'Opening mmsingh.me…';

    const linkRow = document.createElement('div');
    linkRow.className = 'term-contact-row';
    linkRow.style.margin = '4px 0 8px';

    const anchor = document.createElement('a');
    anchor.href = PORTFOLIO_URL;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'term-contact-link';
    anchor.textContent = PORTFOLIO_URL;

    linkRow.appendChild(anchor);
    this.bodyEl.appendChild(line);
    this.bodyEl.appendChild(linkRow);

    windowManager.openWindow('website');
  }

  cmdWhoami() {
    const out = document.createElement('div');
    out.className = 'term-output-block';

    const p = document.createElement('div');
    p.textContent = `${PROFILE_DATA.name} <${PROFILE_DATA.email}>`;
    const r = document.createElement('div');
    r.className = 'term-card-desc';
    r.textContent = `${PROFILE_DATA.role} (${PROFILE_DATA.location})`;

    out.appendChild(p);
    out.appendChild(r);
    this.bodyEl.appendChild(out);
  }

  cmdTheme() {
    windowManager.toggleTheme();
    const line = document.createElement('div');
    line.className = 'term-info';
    line.textContent = `Theme toggled to: ${windowManager.state.theme}`;
    this.bodyEl.appendChild(line);
  }

  clearTerminal() {
    this.bodyEl.innerHTML = '';
  }

  cmdNotFound(input) {
    const err = document.createElement('div');
    err.className = 'term-error';
    err.textContent = `zsh: command not found: ${input}. Run 'help' to see available commands.`;
    this.bodyEl.appendChild(err);
  }

  scrollToBottom() {
    if (this._userScrolledUp) return;
    const scrollContainer = document.getElementById('terminal-output-scroll')
      ?? this.terminalWin?.querySelector('.window-content-scroll');
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }
}

export const terminalController = new TerminalController();
