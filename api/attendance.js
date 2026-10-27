
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
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
        SELECT
          id,
          nama,
          jenis_magang,
          departemen,
          tanggal,
          masuk,
          pulang
        FROM attendance_records
        ORDER BY tanggal DESC, nama ASC
      `;

      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { nama, jenis, departemen, tanggal, masuk, pulang } =
        req.body || {};

      if (!nama || !jenis || !departemen || !tanggal) {
        return res.status(400).json({
          error: "Identitas dan tanggal wajib diisi"
        });
      }

      const hasil = await sql`
        INSERT INTO attendance_records
          (nama, jenis_magang, departemen, tanggal, masuk, pulang)
        VALUES
          (${nama}, ${jenis}, ${departemen}, ${tanggal},
           ${masuk || null}, ${pulang || null})
        ON CONFLICT (tanggal, nama, jenis_magang, departemen)
        DO UPDATE SET
          masuk = COALESCE(attendance_records.masuk, EXCLUDED.masuk),
          pulang = COALESCE(attendance_records.pulang, EXCLUDED.pulang),
          updated_at = NOW()
        RETURNING *
      `;

      return res.status(200).json(hasil[0]);
    }

    return res.status(405).json({
      error: "Metode tidak diizinkan"
    });
  } catch (error) {
    console.error("Kesalahan API absensi:", error);

    return res.status(500).json({
      error: "Gagal memproses data absensi"
    });
  }
}
