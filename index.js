const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "sk-proj-TU_API_KEY_AQUÍ",
});
const openai = new OpenAIApi(configuration);

const { state, saveState } = useSingleFileAuthState("./baileys_auth_info.json");

async function connectToWhatsApp() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log("Conexión cerrada. ¿Reconectar?", shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("¡Conectado a WhatsApp!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify" || !messages[0]?.message) return;

    const msg = messages[0];
    const sender = msg.key.remoteJid;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!texto) return;

    console.log("Mensaje recibido:", texto);

    // Respuesta básica si incluye "tatuaje"
    if (texto.toLowerCase().includes("tatuaje")) {
      await sock.sendMessage(sender, {
        text: "¡Qué onda! Soy Baxto Chatbot 🤖. Mándame tu idea de tatuaje y te digo cómo podemos armarlo.",
      });
      return;
    }

    // Respuesta con inteligencia artificial
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: texto }],
      });

      const respuesta = completion.data.choices[0].message.content;
      await sock.sendMessage(sender, { text: respuesta });
    } catch (error) {
      console.error("Error con OpenAI:", error);
      await sock.sendMessage(sender, { text: "Ocurrió un error al responder. Intenta de nuevo más tarde." });
    }
  });
}

connectToWhatsApp();
