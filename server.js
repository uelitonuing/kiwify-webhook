const express = require("express");
const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.status(200).send("OK - webhook online");
});

app.post("/webhook/kiwify", (req, res) => {
  console.log("Webhook recebido:", new Date().toISOString());
  console.log(JSON.stringify(req.body, null, 2));
  return res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
