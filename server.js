const express = require("express");
const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.status(200).send("OK - webhook online");
});

app.post("/webhook/kiwify", (req, res) => {
  // Tentamos ler o token em formatos comuns
  const tokenHeader =
    req.headers["x-webhook-token"] ||
    req.headers["x-kiwify-token"] ||
    req.headers["authorization"];

  // Se vier como "Bearer TOKEN", pegamos só o TOKEN
  const tokenRecebido = (tokenHeader || "").replace(/^Bearer\s+/i, "").trim();

  // (Opcional) fallback se a plataforma mandar por query: ?token=...
  const tokenQuery = (req.query.token || "").toString().trim();

  const tokenValido =
    tokenRecebido === process.env.KIWIFY_WEBHOOK_TOKEN ||
    tokenQuery === process.env.KIWIFY_WEBHOOK_TOKEN;

  if (!tokenValido) {
    console.log("Webhook rejeitado: token inválido ou ausente.");
    return res.status(401).json({ ok: false, erro: "Token inválido" });
  }

  console.log("Webhook válido recebido:", new Date().toISOString());
  console.log(JSON.stringify(req.body, null, 2));

  return res.status(200).json({ ok: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));

