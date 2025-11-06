/**
 * Enhanced Console Logger
 * Automatically adds filename, line number, and timestamp to console logs
 */

const path = require('path');
const util = require('util');

// ANSI color codes for better visibility
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Text colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
};

/**
 * Get caller information (filename and line number)
 */
function getCallerInfo() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    
    const err = new Error();
    const stack = err.stack;
    
    Error.prepareStackTrace = originalPrepareStackTrace;
    
    // Stack: [0] getCallerInfo, [1] enhancedLog, [2] console.log, [3] actual caller
    const caller = stack[3];
    
    if (caller) {
        const fileName = caller.getFileName();
        const lineNumber = caller.getLineNumber();
        
        if (fileName) {
            // Get relative path from project root
            const relativePath = path.relative(process.cwd(), fileName);
            return `${relativePath}:${lineNumber}`;
        }
    }
    
    return 'unknown';
}

/**
 * Get current timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Format the log prefix
 */
function formatPrefix(level, location) {
    const timestamp = getTimestamp();
    const levelColors = {
        LOG: colors.cyan,
        ERROR: colors.red,
        WARN: colors.yellow,
        INFO: colors.green,
        DEBUG: colors.magenta
    };
    
    const color = levelColors[level] || colors.white;
    
    return `${colors.dim}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset} ${colors.dim}(${location})${colors.reset}`;
}

/**
 * Enhanced logging function
 */
function enhancedLog(level, originalMethod, args) {
    const location = getCallerInfo();
    const prefix = formatPrefix(level, location);
    
    // Convert arguments to array
    const argsArray = Array.from(args);
    
    // Call original console method with prefix
    originalMethod.call(console, prefix, ...argsArray);
}

/**
 * Initialize enhanced console logging
 */
function initializeLogger() {
    // Override console.log
    console.log = function(...args) {
        enhancedLog('LOG', originalConsole.log, args);
    };
    
    // Override console.error
    console.error = function(...args) {
        enhancedLog('ERROR', originalConsole.error, args);
    };
    
    // Override console.warn
    console.warn = function(...args) {
        enhancedLog('WARN', originalConsole.warn, args);
    };
    
    // Override console.info
    console.info = function(...args) {
        enhancedLog('INFO', originalConsole.info, args);
    };
    
    // Override console.debug
    console.debug = function(...args) {
        enhancedLog('DEBUG', originalConsole.debug, args);
    };
    
    originalConsole.log(`${colors.green}✓ Enhanced logger initialized${colors.reset}`);
}

/**
 * Restore original console methods
 */
function restoreConsole() {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
}

module.exports = {
    initialize: initializeLogger,
    restore: restoreConsole,
    colors,
    originalConsole
};
