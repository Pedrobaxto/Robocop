import makeWASocket, { useSingleFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import * as P from "pino";
import OpenAI from "openai";

const { state, saveState } = useSingleFileAuthState("./auth_info.json");

const openai = new OpenAI({
  apiKey: "sk-proj-REEMPLAZA-ESTO-CON-TU-CLAVE", // Pon tu clave de OpenAI aquí
});

const startBot = () => {
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Reconectando...");
        startBot();
      } else {
        console.log("Sesión cerrada. Escanea el QR nuevamente.");
      }
    } else if (connection === "open") {
      console.log("Bot conectado correctamente.");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!text) return;

    if
