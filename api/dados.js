import { window } from "pg"; // Use a biblioteca 'pg' ou '@neondatabase/serverless'

export default async function handler(req, res) {
  const DATABASE_URL =
    "postgresql://neondb_owner:npg_qNL8ZPsiXOu2@ep-falling-river-amskzp6n-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

  // Aqui você implementaria a lógica SQL para INSERT e SELECT no Neon
  // Por enquanto, vamos focar na integração do Frontend que você solicitou.
  res.status(200).json({ message: "Conectado ao Neon" });
}
