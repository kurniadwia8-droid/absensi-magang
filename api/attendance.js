
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      error: "DATABASE_URL belum diatur"
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT * FROM attendance
        ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { nama, tanggal, jenis, waktu } = req.body;

      if (!nama || !tanggal || !jenis || !waktu) {
        return res.status(400).json({
          error: "Data absensi belum lengkap"
        });
      }

      const rows = await sql`
        INSERT INTO attendance
          (nama, tanggal, jenis, waktu)
        VALUES
          (${nama}, ${tanggal}, ${jenis}, ${waktu})
        RETURNING *
      `;

      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({
      error: "Metode tidak diizinkan"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server"
    });
  }
}
