import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";

// Use global to share state across Next.js module contexts
declare global {
  var whatsappClient: Client | undefined;
  var whatsappReady: boolean | undefined;
  var whatsappConnecting: boolean | undefined;
}

const getClient = () => global.whatsappClient || null;
const setClient = (c: Client | null) => {
  global.whatsappClient = c || undefined;
};
const isReady = () => global.whatsappReady || false;
const setReady = (r: boolean) => {
  global.whatsappReady = r;
};
const isConnecting = () => global.whatsappConnecting || false;
const setConnecting = (c: boolean) => {
  global.whatsappConnecting = c;
};

export const initializeWhatsApp = async () => {
  const client = getClient();

  if (client && isReady()) {
    console.log("WhatsApp client already initialized and ready");
    console.log("Current state - Ready:", isReady(), "Client:", !!client);
    return client;
  }

  if (isConnecting()) {
    console.log("WhatsApp client is already connecting...");
    return null;
  }

  setConnecting(true);

  try {
    console.log("Initializing WhatsApp client...");
    console.log("Checking for existing session in .wwebjs_auth/");

    // Try to find system Chrome/Chromium
    const findChrome = () => {
      // Check environment variable first (set in Dockerfile for Cloud Run)
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      const possiblePaths = [
        "/usr/bin/chromium", // Cloud Run / Linux
        "/usr/bin/chromium-browser", // Linux
        "/usr/bin/google-chrome", // Linux
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
        "/Applications/Chromium.app/Contents/MacOS/Chromium", // macOS Chromium
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
      return undefined;
    };

    const executablePath = findChrome();
    const authPath = path.join(process.cwd(), ".wwebjs_auth");

    console.log("Auth path:", authPath);
    console.log("Chrome executable path:", executablePath || "NOT FOUND");

    if (!executablePath) {
      throw new Error(
        "Chromium/Chrome executable not found. " +
          "Please ensure Chromium is installed and PUPPETEER_EXECUTABLE_PATH is set correctly."
      );
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(
        `Chromium executable not found at path: ${executablePath}. ` +
          "Please verify the installation."
      );
    }

    console.log("✓ Chromium executable verified at:", executablePath);

    const newClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: authPath,
      }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // Important for Cloud Run
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-component-extensions-with-background-pages",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
          "--disable-renderer-backgrounding",
          "--disable-sync",
          "--force-color-profile=srgb",
          "--metrics-recording-only",
          "--mute-audio",
          "--hide-scrollbars",
          "--disable-default-apps",
          "--disable-crash-reporter", // Disable crash reporting to avoid the crash handler error
          "--disable-crashpad", // Disable crashpad entirely
        ],
      },
    });

    newClient.on("qr", (qr) => {
      console.log("\n===========================================");
      console.log("SCAN QR CODE WITH YOUR WHATSAPP BUSINESS APP");
      console.log("===========================================\n");
      qrcode.generate(qr, { small: true });
      console.log("\n===========================================\n");
    });

    newClient.on("ready", () => {
      console.log("\n✅✅✅ WhatsApp client is ready! ✅✅✅");
      console.log("Setting global state to ready...");
      setReady(true);
      setConnecting(false);
      console.log("Global whatsappReady:", global.whatsappReady);
      console.log("Global whatsappClient exists:", !!global.whatsappClient);
      console.log("===========================================\n");
    });

    newClient.on("authenticated", () => {
      console.log("✓ WhatsApp client authenticated");
    });

    newClient.on("loading_screen", (percent, message) => {
      console.log("Loading...", percent, message);
    });

    newClient.on("auth_failure", (msg) => {
      console.error("✗ Authentication failure:", msg);
      setConnecting(false);
      setReady(false);
    });

    newClient.on("disconnected", (reason) => {
      console.log("WhatsApp client disconnected:", reason);
      setReady(false);
      setConnecting(false);
    });

    setClient(newClient);
    await newClient.initialize();
    return newClient;
  } catch (error) {
    console.error("Error initializing WhatsApp client:", error);
    setConnecting(false);
    throw error;
  }
};

export const getWhatsAppClient = () => {
  return getClient();
};

export const isWhatsAppReady = () => {
  return isReady();
};

export const sendWhatsAppMessage = async (
  number: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getClient();

  if (!client || !isReady()) {
    return {
      success: false,
      error: "WhatsApp client is not ready. Please wait for QR code scan.",
    };
  }

  try {
    // Format number: remove any non-digit characters
    let formattedNumber = number.replace(/\D/g, "");

    // Remove leading zeros
    formattedNumber = formattedNumber.replace(/^0+/, "");

    console.log(`Attempting to send message to: ${formattedNumber}`);
    console.log(`Original number: ${number}`);

    // Try to get the proper WhatsApp ID for the number
    let chatId;
    try {
      const numberId = await client.getNumberId(formattedNumber);

      if (numberId) {
        chatId = numberId._serialized;
        console.log(`Got WhatsApp ID: ${chatId}`);
      } else {
        console.log(`Number ${formattedNumber} is not registered on WhatsApp`);
        return {
          success: false,
          error: `The number ${number} is not registered on WhatsApp. Please verify the number includes the country code (e.g., +5511999999999).`,
        };
      }
    } catch (idError) {
      console.error("Error getting number ID:", idError);
      return {
        success: false,
        error: `Could not verify WhatsApp number. Please ensure the number is correct and includes the country code.`,
      };
    }

    // Send the message
    console.log(`Sending message to chat ID: ${chatId}`);
    const result = await client.sendMessage(chatId, message);

    console.log(`✓ Message sent successfully to ${formattedNumber}`);
    console.log("Send result:", result);
    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide more helpful error messages
      if (errorMessage.includes("LID")) {
        errorMessage =
          "Invalid phone number format. Please include country code (e.g., +5511999999999 for Brazil).";
      } else if (errorMessage.includes("not registered")) {
        errorMessage = "This number is not registered on WhatsApp.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
