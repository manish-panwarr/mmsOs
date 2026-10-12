/**
 * SCRIPT.JS — Application Entry Point (ES Module)
 * Connects WindowManager, Dashboard Modules, and Terminal Controller.
 */

import { windowManager } from './macos-enhancements.js';
import { initDashboardModules } from './dashboard.js';
import { terminalController } from './terminal.js';

document.addEventListener('DOMContentLoaded', () => {
  windowManager.init();
  initDashboardModules();
  terminalController.init();
});
