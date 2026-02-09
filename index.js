const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!DISCORD_WEBHOOK_URL) {
  console.error("❌ DISCORD_WEBHOOK_URL manquant");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("GMod → Discord relay OK");
});

app.post("/relay", async (req, res) => {
  try {
    const { server, player, steamid, message } = req.body || {};

    if (!player || !message) {
      return res.status(400).json({ error: "missing fields" });
    }

    const safe = (s) =>
      String(s)
        .replace(/@/g, "@\u200B")
        .slice(0, 1800);

    const content =
      `**[${safe(server || "GMod")}]** ` +
      `**${safe(player)}** ` +
      `(${safe(steamid || "UNKNOWN")}) : ` +
      `${safe(message)}`;

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Discord error:", response.status, text);
      return res.status(500).json({ error: "discord failed" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Relay error:", err);
    res.status(500).json({ error: "internal" });
  }
});

app.listen(PORT, () => {
  console.log("Relay listening on port", PORT);
});
