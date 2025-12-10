# Jaime Whats - WhatsApp Business Messaging Service

A web application that allows sending WhatsApp messages via a centralized WhatsApp Business account through both API and web interface.

## Features

- 📱 Send WhatsApp messages via web interface
- 🔌 RESTful API for programmatic message sending
- ✨ Support for WhatsApp message formatting (bold, italic, strikethrough, monospace)
- 🎨 Clean, modern UI built with Next.js and Tailwind CSS
- 🔐 Single centralized WhatsApp Business account (no user login required)
- 🔒 Optional secret key protection for API routes

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **WhatsApp Integration**: whatsapp-web.js
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- WhatsApp Business account (or regular WhatsApp account for testing)
- npm, yarn, or pnpm package manager

### Installation

1. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

2. (Optional) Set up secret key protection by creating a `.env.local` file:

```bash
MESSAGE_SECRET_KEY=your-secret-key-here
```

If `MESSAGE_SECRET_KEY` is set, all API routes will require this secret key to be provided. If not set, the API remains open (no authentication required).

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. **IMPORTANT**: When you start the server, a QR code will be displayed in the terminal. Scan this QR code with your WhatsApp Business app to connect the account.

5. Once connected, open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Web Interface

1. Navigate to `http://localhost:3000`
2. Fill in the form:
   - **Your Name** (required): Sender name (minimum 3 characters) - will appear in bold at the beginning of the message
   - **Phone Number** (required): Include country code (e.g., +5511999999999)
   - **Message** (required): Your message with optional formatting
   - **Secret Key** (optional): Required only if `MESSAGE_SECRET_KEY` is configured on the server
3. Click "Send WhatsApp Message"

#### Message Formatting

Use these formatting codes in your messages:

- `*bold*` - **bold text**
- `_italic_` - _italic text_
- `~strikethrough~` - ~~strikethrough text~~
- `` ```monospace``` `` - `monospace text`

### API Endpoint

> **Note**: If `MESSAGE_SECRET_KEY` environment variable is set, all API endpoints require authentication. Provide the secret key in the `x-secret-key` header.

#### Send Message

**POST** `/api/send-message`

**Request Body:**

```json
{
  "name": "John Doe",
  "number": "+5511999999999",
  "message": "Hello! This is a *formatted* message."
}
```

**Headers (if MESSAGE_SECRET_KEY is set):**

```
x-secret-key: your-secret-key
```

**Success Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "recipient": "+5511999999999",
  "recipientName": "John Doe"
}
```

**Error Response:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message description",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Codes:**
- `401`: Unauthorized (invalid or missing secret key when `MESSAGE_SECRET_KEY` is set)
- `400`: Validation error (missing fields, invalid name, etc.)
- `503`: WhatsApp not connected
- `500`: Internal server error

#### Check Connection Status

**GET** `/api/status`

**Headers (if MESSAGE_SECRET_KEY is set):**

```
x-secret-key: your-secret-key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "ready": true,
    "status": "connected"
  }
}
```

#### Check Number Registration

**POST** `/api/check-number`

**Request Body:**

```json
{
  "number": "+5511999999999"
}
```

**Headers (if MESSAGE_SECRET_KEY is set):**

```
x-secret-key: your-secret-key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "number": "5511999999999",
    "chatId": "5511999999999@c.us",
    "isRegistered": true
  }
}
```

#### Initialize WhatsApp

**GET** `/api/init-whatsapp`

**Headers (if MESSAGE_SECRET_KEY is set):**

```
x-secret-key: your-secret-key
```

**Response:**

```json
{
  "success": true,
  "message": "WhatsApp initialization started",
  "ready": false
}
```

## Project Structure

```
001-jaimewhats/
├── app/
│   ├── api/
│   │   ├── send-message/
│   │   │   └── route.ts          # Message sending API endpoint
│   │   └── init-whatsapp/
│   │       └── route.ts          # WhatsApp initialization endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── message-form.tsx          # Main message form component
├── lib/
│   ├── whatsapp-service.ts       # WhatsApp client service
│   └── utils.ts                  # Utility functions
├── instrumentation.ts            # Server initialization hook
└── next.config.ts                # Next.js configuration
```

## Important Notes

### WhatsApp Connection

- The WhatsApp session persists in the `.wwebjs_auth` folder
- Once authenticated, you won't need to scan the QR code again unless you clear this folder
- The connection indicator on the web interface shows the current status
- If disconnected, check the terminal for QR code

### Phone Number Format

Always include the country code without the `+` or with it:
- ✅ `5511999999999` or `+5511999999999` (Brazil)
- ✅ `1234567890` or `+11234567890` (US)
- ❌ `999999999` (missing country code)

### Security

#### Secret Key Protection

To protect your API endpoints, set the `MESSAGE_SECRET_KEY` environment variable:

```bash
MESSAGE_SECRET_KEY=your-secure-secret-key-here
```

When set, all API routes require this secret key to be provided in the `x-secret-key` header.

If `MESSAGE_SECRET_KEY` is not set, the API remains open (no authentication required).

#### Other Security Considerations

The initial installation may show some vulnerabilities from `whatsapp-web.js` dependencies. These are from the underlying Puppeteer library. For production use, consider:
- Running in a containerized environment
- Implementing rate limiting
- Using the secret key protection feature
- Using allowlists for recipient numbers
- Setting up proper firewall rules

## Production Deployment

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

3. Scan the QR code on first startup

## Troubleshooting

### QR Code Not Appearing

- Make sure the terminal is visible
- Check if `.wwebjs_auth` folder exists and delete it to force re-authentication
- Ensure no firewall is blocking the connection

### Messages Not Sending

- Verify WhatsApp connection status (green indicator)
- Check phone number format includes country code
- Look for errors in the server terminal
- Ensure the number is registered on WhatsApp

### TypeScript Errors

```bash
npm run lint
```

## Future Enhancements

Potential features for future versions:

- User authentication and multi-tenant support
- Message scheduling and campaigns
- Conversation inbox and reply handling
- Message templates
- Analytics and delivery reports
- Media attachment support (images, documents, etc.)
- Webhook support for incoming messages

## License

MIT

## Support

For issues or questions, please check the terminal logs for detailed error messages.
