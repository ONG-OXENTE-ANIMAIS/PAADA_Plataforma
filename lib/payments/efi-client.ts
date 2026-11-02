"use client";

/**
 * Cliente de Tokenização de Cartão de Crédito da Efí (antiga Gerencianet)
 * 
 * Executado 100% no navegador (Client-Side) para conformidade total com PCI-DSS SAQ A.
 * Os dados sensíveis do cartão (número, validade e CVV) são enviados diretamente do browser
 * do doador para os servidores seguros da Efí através do SDK oficial, gerando um `payment_token`
 * descartável. O número e o CVV do cartão NUNCA passam pelo nosso servidor Next.js ou banco de dados.
 */

declare global {
  interface Window {
    EfiPay?: {
      createPaymentToken: (
        params: {
          brand: string;
          number: string;
          cvv: string;
          expirationMonth: string;
          expirationYear: string;
          payeeCode: string;
          sandbox: boolean;
        },
        callback: (
          error: { code?: number; message?: string; error_description?: string } | null,
          response?: { payment_token: string; card_mask?: string },
        ) => void,
      ) => void;
    };
  }
}

/** Carrega o script oficial de tokenização da Efí sob demanda no navegador */
export async function carregarSdkEfi(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.EfiPay?.createPaymentToken) return true;

  return new Promise((resolve) => {
    const scriptExistente = document.getElementById("efi-payment-token-script");
    if (scriptExistente) {
      if (window.EfiPay?.createPaymentToken) {
        resolve(true);
        return;
      }
      scriptExistente.addEventListener("load", () => resolve(true), { once: true });
      scriptExistente.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "efi-payment-token-script";
    script.src = "https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi.min.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Gera o payment_token criptografado na Efí
 */
export async function gerarPaymentTokenEfi(dados: {
  numero: string;
  cvv: string;
  mes: string;
  ano: string;
  bandeira: string;
}): Promise<string> {
  const payeeCode = process.env.NEXT_PUBLIC_EFI_PAYEE_CODE;
  const isSandbox = process.env.NEXT_PUBLIC_EFI_SANDBOX !== "false";

  // Se estiver em ambiente Sandbox e o desenvolvedor ainda não configurou o payeeCode no .env,
  // gera um token simulado para permitir homologação visual local sem travar o desenvolvimento
  if (!payeeCode && isSandbox) {
    return `simulated_token_${Date.now()}`;
  }

  if (!payeeCode) {
    throw new Error(
      "Identificador de Conta da Efí (NEXT_PUBLIC_EFI_PAYEE_CODE) não configurado nas variáveis de ambiente.",
    );
  }

  const carregado = await carregarSdkEfi();
  if (!carregado || !window.EfiPay?.createPaymentToken) {
    throw new Error("Não foi possível carregar o módulo seguro de validação de cartão da Efí.");
  }

  const ano4 = dados.ano.length === 2 ? `20${dados.ano}` : dados.ano;
  const mes2 = dados.mes.padStart(2, "0");

  return new Promise((resolve, reject) => {
    window.EfiPay!.createPaymentToken(
      {
        brand: dados.bandeira.toLowerCase(),
        number: dados.numero.replace(/\D/g, ""),
        cvv: dados.cvv.replace(/\D/g, ""),
        expirationMonth: mes2,
        expirationYear: ano4,
        payeeCode,
        sandbox: isSandbox,
      },
      (error, response) => {
        if (error || !response?.payment_token) {
          const msg =
            error?.error_description ||
            error?.message ||
            "Não foi possível validar os dados do cartão junto à operadora.";
          reject(new Error(msg));
          return;
        }
        resolve(response.payment_token);
      },
    );
  });
}
