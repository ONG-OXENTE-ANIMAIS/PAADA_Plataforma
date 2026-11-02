import fs from "node:fs";
import https from "node:https";
import path from "node:path";

function carregarPem() {
  const inline = (process.env.EFI_CERTIFICATE_PEM || process.env.EFI_CERT_BASE64)?.trim();
  if (inline) {
    return inline.includes("-----BEGIN")
      ? Buffer.from(inline.replace(/\\n/g, "\n"), "utf-8")
      : Buffer.from(inline, "base64");
  }
  const certPath = process.env.EFI_CERTIFICATE_PATH?.trim() || "certificado.pem";
  const resolved = path.isAbsolute(certPath)
    ? certPath
    : path.resolve(process.cwd(), certPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Certificado .pem não encontrado em: ${resolved}. Converta seu .p12 com:\n` +
        `openssl pkcs12 -in seu_certificado.p12 -out certificado.pem -nodes`,
    );
  }
  return fs.readFileSync(resolved);
}

function httpsMtls(urlStr, { method = "GET", headers = {}, body } = {}, pem) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyBuf = body ? Buffer.from(body, "utf-8") : undefined;
    if (bodyBuf) headers["Content-Length"] = String(bodyBuf.byteLength);

    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        cert: pem,
        key: pem,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({ status: res.statusCode ?? 500, text });
        });
      },
    );
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

async function main() {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  const chavePix = process.env.EFI_PIX_KEY;
  const isSandbox = process.env.EFI_SANDBOX !== "false";
  const appUrl = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

  if (!clientId || !clientSecret || !chavePix) {
    console.error("❌ Defina EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_PIX_KEY no seu arquivo .env");
    process.exit(1);
  }
  if (!appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    console.error(
      "❌ Informe a URL pública de produção (HTTPS) via NEXT_PUBLIC_APP_URL no .env ou como argumento:\n" +
        "   npm run setup:webhook -- https://seu-dominio-no-render-ou-vercel.com",
    );
    process.exit(1);
  }

  const efiBase = isSandbox
    ? "https://pix-h.api.efipay.com.br"
    : "https://pix.api.efipay.com.br";
  const webhookUrl = `${appUrl}/api/pagamentos/efi/webhook`;

  console.log(` Ambiente Efí: ${isSandbox ? "HOMOLOGAÇÃO (Sandbox)" : "PRODUÇÃO"}`);
  console.log(`🔑 Chave Pix: ${chavePix}`);
  console.log(`🌐 Destino do Webhook: ${webhookUrl}`);

  const pem = carregarPem();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const authRes = await httpsMtls(
    `${efiBase}/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
    pem,
  );

  if (authRes.status < 200 || authRes.status >= 300) {
    console.error(`❌ Erro na autenticação OAuth (${authRes.status}):`, authRes.text);
    process.exit(1);
  }

  const { access_token } = JSON.parse(authRes.text);

  const putRes = await httpsMtls(
    `${efiBase}/v2/webhook/${encodeURIComponent(chavePix)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "x-skip-mtls-checking": "true",
      },
      body: JSON.stringify({ webhookUrl }),
    },
    pem,
  );

  if (putRes.status >= 200 && putRes.status < 300) {
    console.log("✅ Webhook configurado com sucesso na Efí!");
    console.log("Resposta:", putRes.text);
  } else {
    console.error(`❌ Erro ao configurar Webhook (${putRes.status}):`, putRes.text);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Falha inesperada:", err.message || err);
  process.exit(1);
});
