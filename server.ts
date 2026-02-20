import express from "express";
import { createServer as createViteServer } from "vite";
// import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";

console.log("Starting server process...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Initializing startServer...");
  const app = express();
  const PORT = 3000;

  let db: ReturnType<typeof createClient> | null = null;
  try {
    console.log("Connecting to database...");
    db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log("Database connected.");

    await db.batch(
      [
        {
          sql: `CREATE TABLE IF NOT EXISTS codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          link TEXT NOT NULL,
          is_used BOOLEAN DEFAULT 0,
          used_at DATETIME,
          ip_address TEXT
        )` },
        { sql: `CREATE INDEX IF NOT EXISTS idx_code ON codes(code)` },
        {
          sql: `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )` },
        {
          sql: `CREATE TABLE IF NOT EXISTS brute_force_attempts (
          ip TEXT PRIMARY KEY,
          attempts INTEGER DEFAULT 0,
          last_attempt DATETIME,
          blocked_until DATETIME
        )` },
        {
          sql: `CREATE TABLE IF NOT EXISTS import_jobs (
          id TEXT PRIMARY KEY,
          status TEXT DEFAULT 'pending',
          total_lines INTEGER DEFAULT 0,
          processed_lines INTEGER DEFAULT 0,
          successful_lines INTEGER DEFAULT 0,
          failed_lines INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          error_message TEXT
        )` },
        { sql: `INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', '')` },
        { sql: `INSERT OR IGNORE INTO settings (key, value) VALUES ('end_date', '')` },
      ],
      "write"
    );
    console.log("Database schema initialized.");
  } catch (err) {
    console.error("CRITICAL: Database initialization failed:", err);
    // Continue without DB to at least serve the frontend if possible,
    // or handle it gracefully in routes
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), db_connected: !!db });
  });

  // API Routes

  // Get Settings
  app.get("/api/settings", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const result = await db.execute("SELECT * FROM settings");
    const rows = result.rows as any[];
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  });

  // Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    // In a real app, use environment variables and hashing
    if (password === (process.env.ADMIN_PASSWORD || "admin123")) {
      res.json({ success: true, token: "mock-jwt-token" });
    } else {
      res.status(401).json({ error: "invalid_credentials", message: "Senha incorreta." });
    }
  });

  // Update Settings
  app.post("/api/admin/settings", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { start_date, end_date } = req.body;
    await db.execute({ sql: "UPDATE settings SET value = ? WHERE key = ?", args: [start_date || "", "start_date"] });
    await db.execute({ sql: "UPDATE settings SET value = ? WHERE key = ?", args: [end_date || "", "end_date"] });
    res.json({ success: true });
  });

  // Redeem Code
  app.post("/api/redeem", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { code, captchaToken } = req.body;
    const ip = (req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown').toString().split(',')[0].trim();

    const settingsResult = await db.execute("SELECT * FROM settings");
    const settingsRows = settingsResult.rows as any[];
    const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    const now = new Date();

    if (settings.start_date && new Date(settings.start_date) > now) {
      return res.status(403).json({ error: "not_started", message: "A promoção ainda não começou." });
    }
    if (settings.end_date && new Date(settings.end_date) < now) {
      return res.status(403).json({ error: "ended", message: "Promoção encerrada." });
    }

    const blockResult = await db.execute({ sql: "SELECT * FROM brute_force_attempts WHERE ip = ?", args: [ip] });
    const checkBlock = (blockResult.rows[0] as any) ?? null;
    if (checkBlock && checkBlock.blocked_until && new Date(checkBlock.blocked_until) > now) {
      const remaining = Math.ceil((new Date(checkBlock.blocked_until).getTime() - now.getTime()) / 60000);
      return res.status(429).json({
        error: "blocked",
        message: `Muitas tentativas. Tente novamente em ${remaining} minutos.`
      });
    }

    if (!code) {
      return res.status(400).json({ error: "missing_fields", message: "Código é obrigatório." });
    }
    if (!captchaToken) {
      return res.status(400).json({ error: "captcha", message: "Por favor, complete o desafio de segurança." });
    }

    const codeResult = await db.execute({ sql: "SELECT * FROM codes WHERE code = ?", args: [code.toUpperCase()] });
    const row = (codeResult.rows[0] as any) ?? null;

    if (!row) {
      const attempts = (checkBlock?.attempts ?? 0) + 1;
      let blockedUntil: string | null = null;
      if (attempts >= 5) {
        const blockDate = new Date();
        blockDate.setMinutes(blockDate.getMinutes() + 15);
        blockedUntil = blockDate.toISOString();
      }
      await db.execute({
        sql: `INSERT INTO brute_force_attempts (ip, attempts, last_attempt, blocked_until)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ip) DO UPDATE SET
                attempts = excluded.attempts,
                last_attempt = excluded.last_attempt,
                blocked_until = excluded.blocked_until`,
        args: [ip, attempts, now.toISOString(), blockedUntil],
      });
      return res.status(404).json({
        error: "invalid",
        message: attempts >= 5
          ? "Muitas tentativas incorretas. Seu acesso foi bloqueado temporariamente."
          : "Código inválido. Verifique se digitou corretamente."
      });
    }

    if (row.is_used) {
      return res.status(400).json({ error: "used", message: "Este código já foi utilizado anteriormente." });
    }

    await db.execute({ sql: "DELETE FROM brute_force_attempts WHERE ip = ?", args: [ip] });
    await db.execute({
      sql: "UPDATE codes SET is_used = 1, used_at = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?",
      args: [ip, row.id],
    });

    res.json({ success: true, link: row.link });
  });

  // Admin Stats
  app.get("/api/stats", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const totalResult = await db.execute("SELECT COUNT(*) as count FROM codes");
    const total = (totalResult.rows[0] as any);
    const usedResult = await db.execute("SELECT COUNT(*) as count FROM codes WHERE is_used = 1");
    const used = (usedResult.rows[0] as any);
    const recentResult = await db.execute(`
      SELECT code, ip_address, used_at
      FROM codes
      WHERE is_used = 1
      ORDER BY used_at DESC
      LIMIT 10
    `);
    res.json({
      total: total.count,
      used: used.count,
      available: total.count - used.count,
      recent: recentResult.rows,
    });
  });

  // Get All Codes (Paginated)
  app.get("/api/admin/codes", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let countQuery = "SELECT COUNT(*) as count FROM codes";
    const countArgs: any[] = [];
    if (search) {
      countQuery += " WHERE code LIKE ? OR ip_address LIKE ?";
      countArgs.push(`%${search}%`, `%${search}%`);
    }
    const countResult = await db.execute(
      countArgs.length ? { sql: countQuery, args: countArgs } : countQuery
    );
    const count = (countResult.rows[0] as any);

    let query = "SELECT * FROM codes";
    const queryArgs: any[] = [];
    if (search) {
      query += " WHERE code LIKE ? OR ip_address LIKE ?";
      queryArgs.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    queryArgs.push(limit, offset);
    const rowsResult = await db.execute({ sql: query, args: queryArgs });

    res.json({
      codes: rowsResult.rows,
      total: count.count,
      page,
      totalPages: Math.ceil(count.count / limit),
    });
  });

  // Export Redeemed Codes
  app.get("/api/admin/export-redeemed", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const result = await db.execute(`
      SELECT code, link, used_at, ip_address
      FROM codes
      WHERE is_used = 1
      ORDER BY used_at DESC
    `);
    const rows = result.rows as any[];
    let csv = "codigo,link,data,ip\n";
    rows.forEach(row => {
      csv += `${row.code},${row.link},${row.used_at},${row.ip_address}\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=resgates.csv");
    res.send(csv);
  });

  // Importação em fila: processa CSV em chunks de 5k
  const importQueue = new Map<string, { status: string; progress: number }>();

  async function processImportChunks(jobId: string, lines: string[], chunkSize: number = 5000) {
    if (!db) return;
    const totalLines = lines.length;
    const chunks: string[][] = [];
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize));
    }
    let successfulLines = 0;
    let failedLines = 0;

    await db.execute({
      sql: `INSERT INTO import_jobs (id, status, total_lines, processed_lines, successful_lines, failed_lines)
            VALUES (?, 'processing', ?, 0, 0, 0)
            ON CONFLICT(id) DO UPDATE SET status = 'processing'`,
      args: [jobId, totalLines],
    });

    try {
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        // const txn = await db.transaction("write");

        const statements = chunk.map(line => {
          const parts = line.split(",").map((s) => s.trim());
          const [code, link] = parts;
          return {
            sql: "INSERT OR IGNORE INTO codes (code, link) VALUES (?, ?)",
            args: [code?.toUpperCase(), link],
          };
        }).filter(stmt => stmt.args[0] && stmt.args[1]); // Remove linhas inválidas

        try {
          // Envia o bloco inteiro (uma única requisição HTTP para o Turso)
          const results = await db.batch(statements, "write");

          // Calcula quantos foram inseridos de fato (rowsAffected > 0)
          const chunkSuccess = results.filter(r => r.rowsAffected > 0).length;
          successfulLines += chunkSuccess;
          failedLines += (chunk.length - chunkSuccess);

        } catch (chunkErr) {
          console.error("Erro no batch:", chunkErr);
          failedLines += chunk.length;
        }

        // try {
        //   for (const line of chunk) {
        //     const parts = line.split(",").map((s: string) => s.trim());
        //     if (parts.length >= 2) {
        //       const [code, link] = parts;
        //       if (code && link) {
        //         const r = await txn.execute({
        //           sql: "INSERT OR IGNORE INTO codes (code, link) VALUES (?, ?)",
        //           args: [code.toUpperCase(), link],
        //         });
        //         if (r.rowsAffected > 0) successfulLines++;
        //       } else {
        //         failedLines++;
        //       }
        //     } else {
        //       failedLines++;
        //     }
        //   }
        //   await txn.commit();
        // } catch (chunkErr) {
        //   await txn.rollback();
        //   throw chunkErr;
        // }

        const processedLines = Math.min((chunkIndex + 1) * chunkSize, totalLines);
        const progress = Math.min((processedLines / totalLines) * 100, 100);
        await db.execute({
          sql: `UPDATE import_jobs SET processed_lines = ?, successful_lines = ?, failed_lines = ? WHERE id = ?`,
          args: [processedLines, successfulLines, failedLines, jobId],
        });
        importQueue.set(jobId, { status: 'processing', progress: Math.round(progress) });

        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      await db.execute({
        sql: `UPDATE import_jobs SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
              processed_lines = ?, successful_lines = ?, failed_lines = ? WHERE id = ?`,
        args: [totalLines, successfulLines, failedLines, jobId],
      });
      importQueue.set(jobId, { status: 'completed', progress: 100 });
    } catch (err) {
      console.error("Import error:", err);
      await db.execute({
        sql: `UPDATE import_jobs SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?`,
        args: [String(err), jobId],
      });
      importQueue.set(jobId, { status: 'failed', progress: 0 });
    }
  }

  // Upload CSV - inicia processamento assíncrono
  app.post("/api/admin/upload-csv", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: "Dados do CSV não fornecidos." });

    const lines = csvData.split("\n").filter((line: string) => line.trim());
    if (lines.length === 0) {
      return res.status(400).json({ error: "CSV vazio ou inválido." });
    }

    // Gerar ID único para o job
    const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Iniciar processamento em background (não bloqueia resposta)
    processImportChunks(jobId, lines, 5000).catch(err => {
      console.error("Background import failed:", err);
    });

    // Retornar imediatamente com job ID
    res.json({
      success: true,
      jobId,
      message: `Importação iniciada. Processando ${lines.length} linhas em chunks de 5k...`,
      totalLines: lines.length
    });
  });

  // Verificar status da importação
  app.get("/api/admin/import-status/:jobId", async (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { jobId } = req.params;
    const result = await db.execute({ sql: "SELECT * FROM import_jobs WHERE id = ?", args: [jobId] });
    const job = (result.rows[0] as any) ?? null;
    if (!job) {
      return res.status(404).json({ error: "Job não encontrado." });
    }
    const progress = job.total_lines > 0
      ? Math.round((job.processed_lines / job.total_lines) * 100)
      : 0;
    res.json({
      jobId: job.id,
      status: job.status,
      progress,
      totalLines: job.total_lines,
      processedLines: job.processed_lines,
      successfulLines: job.successful_lines,
      failedLines: job.failed_lines,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
    });
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "internal_error", message: "Ocorreu um erro interno no servidor." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware loaded.");
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
});
