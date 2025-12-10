'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-white shadow-lg rounded-md p-2 hover:bg-gray-50 transition-colors"
        aria-label="Toggle API documentation"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto border-l border-gray-200
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-600">API Documentation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          <div className="space-y-4">
            {/* Send Message API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">POST /api/send-message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Send a WhatsApp message to a phone number.
                </p>
                <div>
                  <p className="text-sm font-semibold mb-2">Request Body:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "name": "John Doe",      // Required: sender name (min 3 chars)
  "number": "+5511999999999",  // Required: phone with country code
  "message": "Hello!"      // Required: message content
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Success Response (200):</p>
                  <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "message": "Message sent successfully",
  "recipient": "+5511999999999",
  "recipientName": "John Doe"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Error Responses:</p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li><strong>400:</strong> Missing required fields or invalid name (must be at least 3 characters)</li>
                    <li><strong>503:</strong> WhatsApp not connected</li>
                    <li><strong>500:</strong> Failed to send message</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Status API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /api/status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Check WhatsApp connection status.
                </p>
                <div>
                  <p className="text-sm font-semibold mb-2">Response (200):</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "ready": true,
  "status": "connected"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Check Number API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">POST /api/check-number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Check if a phone number is registered on WhatsApp.
                </p>
                <div>
                  <p className="text-sm font-semibold mb-2">Request Body:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "number": "+5511999999999"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Response (200):</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "number": "5511999999999",
  "chatId": "5511999999999@c.us",
  "isRegistered": true,
  "numberId": {...}
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Init WhatsApp API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /api/init-whatsapp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Initialize WhatsApp connection. Check server terminal for QR code.
                </p>
                <div>
                  <p className="text-sm font-semibold mb-2">Response (200):</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "message": "WhatsApp initialization started",
  "ready": false
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Message Formatting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Formatting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  WhatsApp supports text formatting:
                </p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li><code>*bold*</code> → <strong>bold</strong></li>
                  <li><code>_italic_</code> → <em>italic</em></li>
                  <li><code>~strikethrough~</code> → <del>strikethrough</del></li>
                  <li><code>```monospace```</code> → <code>monospace</code></li>
                </ul>
              </CardContent>
            </Card>

            {/* Phone Number Format */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phone Number Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  Always include country code:
                </p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>✅ <code>+5511999999999</code> (Brazil)</li>
                  <li>✅ <code>+11234567890</code> (US)</li>
                  <li>❌ <code>999999999</code> (missing country code)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>
    </>
  );
}

