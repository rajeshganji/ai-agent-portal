const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = {
  // Helmet configuration for security headers
  helmetConfig: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "stackpath.bootstrapcdn.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "code.jquery.com", "cdn.jsdelivr.net", "stackpath.bootstrapcdn.com"],
        connectSrc: ["'self'", "wss:", "ws:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        mediaSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:", "fonts.googleapis.com", "fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true,
    xssFilter: true
  }),

  // Enhanced CSP configuration specifically for IVR Designer
  ivrDesignerCSP: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "wss:", "ws:"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true,
    xssFilter: true
  }),

  // Rate limiting configurations
  rateLimiters: {
    // General API rate limiting
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        message: 'Please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // Strict rate limiting for authentication endpoints
    auth: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per windowMs
      message: {
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
      },
      skipSuccessfulRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // Rate limiting for PBX webhooks
    pbxWebhook: rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 50, // 50 requests per minute
      message: {
        error: 'PBX webhook rate limit exceeded',
        message: 'Please slow down'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // Rate limiting for IVR flow
    ivr: rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute per IP
      message: {
        error: 'IVR rate limit exceeded',
        message: 'Too many IVR requests'
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  },

  // CORS configuration
  corsConfig: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [
            'http://localhost:3000', 
            'http://localhost:8080',
            'http://localhost:5173',
            'https://ai-agent-portal-production.up.railway.app'
          ];
      
      // In production, also allow Railway domain
      if (allowedOrigins.indexOf(origin) !== -1 || 
          process.env.NODE_ENV === 'development' ||
          origin?.includes('railway.app')) {
        callback(null, true);
      } else {
        console.log('[CORS] Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400 // 24 hours
  },

  // Session security configuration
  sessionConfig: {
    secret: process.env.SESSION_SECRET || 'change-me-in-production-use-railway-env',
    name: 'sessionId', // Don't use default name
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict', // CSRF protection
      path: '/',
    },
    rolling: true, // Reset expiration on every request
  },

  // Input validation rules
  validationRules: {
    agentId: {
      in: ['body'],
      trim: true,
      isLength: {
        options: { min: 3, max: 50 },
        errorMessage: 'Agent ID must be between 3 and 50 characters'
      },
      matches: {
        options: /^[a-zA-Z0-9_-]+$/,
        errorMessage: 'Agent ID can only contain letters, numbers, hyphens, and underscores'
      }
    },
    password: {
      in: ['body'],
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters'
      }
    },
    status: {
      in: ['body'],
      isIn: {
        options: [['ready', 'incoming', 'busy', 'acw', 'pause']],
        errorMessage: 'Invalid status value'
      }
    }
  }
};
