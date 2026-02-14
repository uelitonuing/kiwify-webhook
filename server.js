const express = require("express");
const app = express();
async function enviarTelegram(texto) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram não configurado (faltam variáveis).");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      disable_web_page_preview: true
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.log("Erro Telegram:", resp.status, t);
  }
}

function formatarBRL(valor) {
  const n = Number(String(valor).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pegar(payload, caminhos) {
  for (const c of caminhos) {
    const partes = c.split(".");
    let v = payload;
    for (const p of partes) v = v?.[p];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

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
  const payload = req.body;

  const status = pegar(payload, [
    "status",
    "order.status",
    "sale.status",
    "payment.status"
  ]) || "desconhecido";

  const produto = pegar(payload, [
    "product.name",
    "order.product_name",
    "order.product.name",
    "sale.product_name",
    "sale.product.name"
  ]) || "não identificado";

  const nome = pegar(payload, [
    "customer.name",
    "buyer.name",
    "order.customer.name",
    "order.buyer.name"
  ]) || "não identificado";

  const valorRaw = pegar(payload, [
    "order.total",
    "order.amount",
    "sale.total",
    "sale.amount",
    "payment.amount",
    "amount",
    "total"
  ]);

  const valorBRL = formatarBRL(valorRaw) || String(valorRaw || "não identificado");

  // Envia em paralelo (não trava a resposta da Kiwify)
  const msg =
`🧾 Kiwify - Atualização

✅ Status: ${status}
📦 Produto: ${produto}
👤 Cliente: ${nome}
💰 Valor: ${valorBRL}
🕒 ${new Date().toLocaleString("pt-BR")}`;

  enviarTelegram(msg).catch(() => {});

  return res.status(200).json({ ok: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));



