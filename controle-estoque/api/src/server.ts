import express from "express";
import cors from "cors";
import routes from "./routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Registro de todas as rotas
app.use("/api", routes);

// Rota de status simples
app.get("/health", (req, res) => {
  return res.json({ status: "ok", service: "controle-estoque-api", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
