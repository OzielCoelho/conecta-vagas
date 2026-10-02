import "dotenv/config";
import { buildApp } from "./app";

const app = buildApp();
async function start() {
  try {
    const port = Number(process.env.PORT) || 3333;
    await app.listen({ port, host: "0.0.0.0" });
  } catch {
    app.log.error("Não foi possível iniciar a API. Verifique a configuração e a porta.");
    process.exit(1);
  }
}
start();
