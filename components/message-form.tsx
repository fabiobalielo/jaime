"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import countryCodesData from "@/data/country-codes.json";

export default function MessageForm() {
  // Process and sort country codes
  const countryCodes = useMemo(() => {
    return countryCodesData
      .map((country) => ({
        ...country,
        dial_code: country.dial_code.replace(/\s+/g, ""), // Remove spaces from dial codes
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [secretKeyRequired, setSecretKeyRequired] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [whatsappReady, setWhatsappReady] = useState<boolean | null>(null);

  // Check if secret key is required on mount
  useEffect(() => {
    const checkAuthConfig = async () => {
      try {
        const response = await fetch("/api/auth-config");
        const result = await response.json();
        if (result.success) {
          setSecretKeyRequired(result.data?.secretKeyRequired ?? false);
        }
      } catch (error) {
        console.error("Error checking auth config:", error);
        // Default to showing the field if we can't determine
        setSecretKeyRequired(null);
      }
    };
    checkAuthConfig();
  }, []);

  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status");
      const result = await response.json();
      console.log("WhatsApp status:", result);
      setWhatsappReady(result.data?.ready ?? false);
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setWhatsappReady(false);
    }
  }, []);

  // Check WhatsApp connection status on mount
  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkWhatsAppStatus]);

  // Auto-dismiss status notifications after timeout
  useEffect(() => {
    if (status.type) {
      const timeout = setTimeout(
        () => {
          setStatus({ type: null, message: "" });
        },
        status.type === "success" ? 5000 : 7000
      ); // 5s for success, 7s for errors

      return () => clearTimeout(timeout);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    // Validate name
    if (!name || name.trim().length < 3) {
      setStatus({
        type: "error",
        message:
          "Your name is required and must be at least 3 characters long.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (secretKeyRequired && secretKey) {
        headers["x-secret-key"] = secretKey;
      }

      const body: Record<string, string> = {
        name: name.trim(),
        number: `${countryCode}${number}`,
        message: message.trim(), // Send raw message - server will add name in bold
      };

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: `Message sent successfully to ${countryCode}${number}!`,
        });
        // Clear only the message field on success
        setMessage("");
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to send message",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPreview = (text: string) => {
    // Preview WhatsApp formatting
    return text
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // Bold
      .replace(/_(.*?)_/g, "<em>$1</em>") // Italic
      .replace(/~(.*?)~/g, "<del>$1</del>") // Strikethrough
      .replace(/```(.*?)```/g, "<code>$1</code>") // Monospace
      .replace(/\n/g, "<br />"); // Line breaks
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 lg:p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-green-600">
                Jaime Whats
              </CardTitle>
              <CardDescription className="mt-2">
                Send WhatsApp messages via our Business account
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  whatsappReady === null
                    ? "bg-gray-400"
                    : whatsappReady
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">
                {whatsappReady === null
                  ? "Checking..."
                  : whatsappReady
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {whatsappReady === false && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ WhatsApp is not connected. Check the server terminal to scan
                the QR code.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Your name will appear in bold at the beginning of the message
                (minimum 3 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <select
                  id="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.dial_code}>
                      {country.dial_code} {country.name}
                    </option>
                  ))}
                </select>
                <Input
                  id="number"
                  type="tel"
                  placeholder="11999999999"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter phone number without country code (selected above)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Type your message here... &#10;&#10;Use *bold*, _italic_, ~strikethrough~, ```monospace```"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500">
                Formatting: *bold* _italic_ ~strikethrough~ ```monospace```
              </p>
            </div>

            {secretKeyRequired && (
              <div className="space-y-2">
                <Label htmlFor="secretKey">
                  Secret Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Required to authenticate API requests
                </p>
              </div>
            )}

            {message && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: formatPreview(
                        name ? `*${name}*\n\n${message}` : message
                      ),
                    }}
                  />
                </div>
              </div>
            )}

            {status.type && (
              <div
                className={`p-4 rounded-lg ${
                  status.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : status.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isLoading ||
                !whatsappReady ||
                !name ||
                name.trim().length < 3 ||
                (secretKeyRequired === true && !secretKey)
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send WhatsApp Message"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
