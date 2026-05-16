/** Socket.IO CORS — FRONTEND_URL(쉼표 구분)을 origin 배열로 파싱 */
export function getWebSocketCorsOrigins(): string[] {
  const raw = process.env.FRONTEND_URL;
  if (!raw?.trim()) {
    return ["http://localhost:3000"];
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : ["http://localhost:3000"];
}

export const webSocketCorsOptions = {
  origin: getWebSocketCorsOrigins(),
  credentials: true as const,
};
