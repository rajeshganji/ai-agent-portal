# Enhanced Logger Documentation

## 🎯 Features

The enhanced logger automatically adds the following to all console logs:
- **Timestamp**: ISO 8601 format
- **Log Level**: LOG, ERROR, WARN, INFO, DEBUG
- **File Location**: Filename and line number
- **Color Coding**: Different colors for different log levels

## 📊 Output Format

```
[timestamp] [LEVEL] (filename:line) Your log message
```

### Example Output

```bash
[2025-11-06T18:02:33.471Z] [LOG] (server.js:214) ✅ [Server] Running at http://0.0.0.0:3000
[2025-11-06T18:02:47.289Z] [LOG] (src/routes/pbx.js:13) [IVR] Incoming call parameters
[2025-11-06T18:03:15.123Z] [ERROR] (streamClient.js:45) ⚠️ WebSocket error
[2025-11-06T18:03:20.456Z] [WARN] (auth.js:78) Invalid authentication attempt
```

## 🎨 Color Coding

- **LOG**: Cyan
- **ERROR**: Red
- **WARN**: Yellow
- **INFO**: Green
- **DEBUG**: Magenta
- Timestamp and location are dimmed for better readability

## 🚀 Usage

### Automatic Initialization

The logger is automatically initialized in `server.js` at bootstrap:

```javascript
// Initialize enhanced logger first (before any other imports)
const logger = require('./src/lib/logger');
logger.initialize();
```

### No Code Changes Required

Once initialized, **all existing `console.log()` calls automatically get enhanced**:

```javascript
// Before
console.log('[Server] Starting...');

// After initialization - same code, enhanced output:
// [2025-11-06T18:02:33.471Z] [LOG] (server.js:214) [Server] Starting...
```

### All Console Methods Supported

```javascript
console.log('Regular log message');
console.error('Error message');
console.warn('Warning message');
console.info('Info message');
console.debug('Debug message');
```

## 🔧 Configuration

### Disable Enhanced Logger

If you need to disable it temporarily:

```javascript
const logger = require('./src/lib/logger');
logger.restore(); // Restore original console methods
```

### Access Original Console

```javascript
const logger = require('./src/lib/logger');
logger.originalConsole.log('This bypasses enhanced logging');
```

## 📝 Benefits

### 1. **Easy Debugging**
- Instantly see which file and line produced the log
- No need to manually add file/function names to logs

### 2. **Better Traceability**
- Timestamp on every log for timing analysis
- Track execution flow across multiple files

### 3. **No Code Changes**
- Works with existing `console.log()` calls
- No need to import logger in every file
- No need to change existing code

### 4. **Production Ready**
- Colored output in development
- Works in Railway/production environments
- Minimal performance overhead

### 5. **Stack Trace Information**
- Automatically extracts caller information
- Shows relative path from project root

## 🎯 Real-World Examples

### Before Enhanced Logger:
```
[Server] Setting up monitoring routes
[Server] Setting up stream routes
[IVR] Incoming call parameters: { event: 'NewCall' }
```

**Problem**: Hard to know which file logged what.

### After Enhanced Logger:
```
[2025-11-06T18:02:33.464Z] [LOG] (server.js:156) [Server] Setting up monitoring routes
[2025-11-06T18:02:33.466Z] [LOG] (server.js:161) [Server] Setting up stream routes
[2025-11-06T18:02:47.289Z] [LOG] (src/routes/pbx.js:13) [IVR] Incoming call parameters: { event: 'NewCall' }
```

**Solution**: Instantly see file, line, and timing!

## 🐛 Debugging Made Easy

When you see an error:
```
[2025-11-06T18:05:12.789Z] [ERROR] (streamClient.js:156) Connection failed
```

You can immediately:
1. Open `streamClient.js`
2. Go to line 156
3. See the exact code that logged the error

## 📦 File Structure

```
agent-login-app/
├── src/
│   └── lib/
│       └── logger.js          # Enhanced logger implementation
└── server.js                   # Initialized at bootstrap
```

## ⚡ Performance

- **Minimal Overhead**: Only adds ~1-2ms per log
- **Stack Trace**: Uses V8's optimized stack trace API
- **No Dependencies**: Pure Node.js implementation

## 🎨 Customization

You can customize colors by modifying `src/lib/logger.js`:

```javascript
const levelColors = {
    LOG: colors.cyan,      // Change to your preferred color
    ERROR: colors.red,
    WARN: colors.yellow,
    INFO: colors.green,
    DEBUG: colors.magenta
};
```

## 🌐 Railway/Production

The logger works in production environments:
- Timestamps help with log aggregation
- File locations aid in debugging production issues
- Colors may not show in some log viewers (graceful fallback)

## ✅ Summary

**What it does:**
- Adds timestamp, log level, filename, and line number to every console log
- Zero code changes required
- Works with all console methods
- Color-coded for easy reading

**How to use:**
- Already initialized in `server.js`
- Just use `console.log()` as normal
- Enhanced output automatically!

**Perfect for:**
- Debugging complex applications
- Production troubleshooting
- Understanding execution flow
- Tracking down issues quickly

🎉 **Now you can see exactly where every log comes from!**
