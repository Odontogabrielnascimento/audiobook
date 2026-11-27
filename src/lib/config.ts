export const config = {
  // Nome fixo da marca (a antiga variavel NEXT_PUBLIC_APP_NAME foi descontinuada)
  appName: "Sarça Play",
  appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  planPrice: Number(process.env.PLAN_PRICE || "19.90"),
  planDescription: process.env.PLAN_DESCRIPTION || "Assinatura mensal",
  graceDays: Number(process.env.GRACE_DAYS || "3"),
  // Dados exibidos em Ajuda, Termos e Privacidade
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  // Dados da empresa (comprovante de CNPJ de 27/11/2026); as variaveis de ambiente podem substitui-los
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "A1 Publications e Papelaria Ltda",
  legalId: process.env.NEXT_PUBLIC_LEGAL_ID || "70.338.137/0001-36",
  tradeName: process.env.NEXT_PUBLIC_TRADE_NAME || "A1 Publications",
  // Endereco da sede: guardado aqui, mas NAO exibido no site por decisao do responsavel
  legalAddress:
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS ||
    "Rua Nicola Ricciardi, 67, Irmãos Ricciardi, Guaxupé/MG, CEP 37837-502",
};

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m === 0) return s > 0 ? "menos de 1 min" : "0 min";
  return `${m} min`;
}

// Datas sem horario (ex.: vencimento) vem do banco como meia-noite UTC: exibir em UTC evita mostrar o dia anterior
export function formatDay(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
