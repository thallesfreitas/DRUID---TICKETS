import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

console.log("Starting server process...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Initializing startServer...");
  const app = express();
  const PORT = 3000;

  let db: any;
  try {
    console.log("Connecting to database...");
    db = new Database("promo.db");
    console.log("Database connected.");
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        link TEXT NOT NULL,
        is_used BOOLEAN DEFAULT 0,
        used_at DATETIME,
        ip_address TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_code ON codes(code);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS brute_force_attempts (
        ip TEXT PRIMARY KEY,
        attempts INTEGER DEFAULT 0,
        last_attempt DATETIME,
        blocked_until DATETIME
      );

      -- Default settings if not exist
      INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', '');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('end_date', '');
    `);
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
  app.get("/api/settings", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const rows = db.prepare("SELECT * FROM settings").all() as any[];
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
  app.post("/api/admin/settings", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { start_date, end_date } = req.body;
    const update = db.prepare("UPDATE settings SET value = ? WHERE key = ?");
    update.run(start_date || "", "start_date");
    update.run(end_date || "", "end_date");
    res.json({ success: true });
  });

  // Redeem Code
  app.post("/api/redeem", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { code, captchaToken } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // 0. Check Dates
    const settingsRows = db.prepare("SELECT * FROM settings").all() as any[];
    const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    const now = new Date();

    if (settings.start_date && new Date(settings.start_date) > now) {
      return res.status(403).json({ error: "not_started", message: "A promoção ainda não começou." });
    }
    if (settings.end_date && new Date(settings.end_date) < now) {
      return res.status(403).json({ error: "ended", message: "Promoção encerrada." });
    }

    // 1. Check if IP is blocked
    const checkBlock = db.prepare("SELECT * FROM brute_force_attempts WHERE ip = ?").get(ip) as any;
    if (checkBlock && checkBlock.blocked_until && new Date(checkBlock.blocked_until) > now) {
      const remaining = Math.ceil((new Date(checkBlock.blocked_until).getTime() - now.getTime()) / 60000);
      return res.status(429).json({ 
        error: "blocked", 
        message: `Muitas tentativas. Tente novamente em ${remaining} minutos.` 
      });
    }

    // 2. Validate Inputs
    if (!code) {
      return res.status(400).json({ error: "missing_fields", message: "Código é obrigatório." });
    }

    // 3. Mock reCAPTCHA Verification
    if (!captchaToken) {
      return res.status(400).json({ error: "captcha", message: "Por favor, complete o desafio de segurança." });
    }

    const stmt = db.prepare("SELECT * FROM codes WHERE code = ?");
    const row = stmt.get(code.toUpperCase()) as any;

    if (!row) {
      // Increment failure count
      const attempts = (checkBlock?.attempts || 0) + 1;
      let blockedUntil = null;

      if (attempts >= 5) {
        const blockDate = new Date();
        blockDate.setMinutes(blockDate.getMinutes() + 15);
        blockedUntil = blockDate.toISOString();
      }

      db.prepare(`
        INSERT INTO brute_force_attempts (ip, attempts, last_attempt, blocked_until)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(ip) DO UPDATE SET 
          attempts = excluded.attempts,
          last_attempt = excluded.last_attempt,
          blocked_until = excluded.blocked_until
      `).run(ip, attempts, now.toISOString(), blockedUntil);

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

    // Reset failure count on success
    db.prepare("DELETE FROM brute_force_attempts WHERE ip = ?").run(ip);

    // Mark as used
    const updateStmt = db.prepare(`
      UPDATE codes 
      SET is_used = 1, used_at = CURRENT_TIMESTAMP, ip_address = ? 
      WHERE id = ?
    `);
    updateStmt.run(ip, row.id);

    res.json({ 
      success: true, 
      link: row.link
    });
  });

  // Admin Stats
  app.get("/api/stats", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const total = db.prepare("SELECT COUNT(*) as count FROM codes").get() as any;
    const used = db.prepare("SELECT COUNT(*) as count FROM codes WHERE is_used = 1").get() as any;
    
    const recent = db.prepare(`
      SELECT code, ip_address, used_at 
      FROM codes 
      WHERE is_used = 1 
      ORDER BY used_at DESC 
      LIMIT 10
    `).all();

    res.json({
      total: total.count,
      used: used.count,
      available: total.count - used.count,
      recent
    });
  });

  // Get All Codes (Paginated)
  app.get("/api/admin/codes", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = "SELECT * FROM codes";
    let countQuery = "SELECT COUNT(*) as count FROM codes";
    const params: any[] = [];

    if (search) {
      query += " WHERE code LIKE ? OR ip_address LIKE ?";
      countQuery += " WHERE code LIKE ? OR ip_address LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    const count = db.prepare(countQuery).get(...(search ? [params[0], params[1]] : [])) as any;
    const rows = db.prepare(query).all(...params, limit, offset);

    res.json({
      codes: rows,
      total: count.count,
      page,
      totalPages: Math.ceil(count.count / limit)
    });
  });

  // Export Redeemed Codes
  app.get("/api/admin/export-redeemed", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const rows = db.prepare(`
      SELECT code, link, used_at, ip_address 
      FROM codes 
      WHERE is_used = 1 
      ORDER BY used_at DESC
    `).all() as any[];

    let csv = "codigo,link,data,ip\n";
    rows.forEach(row => {
      csv += `${row.code},${row.link},${row.used_at},${row.ip_address}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=resgates.csv");
    res.send(csv);
  });

  // Upload CSV
  app.post("/api/admin/upload-csv", (req, res) => {
    if (!db) return res.status(500).json({ error: "db_not_connected" });
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: "Dados do CSV não fornecidos." });

    const lines = csvData.split("\n");
    const insert = db.prepare("INSERT OR IGNORE INTO codes (code, link) VALUES (?, ?)");
    
    let count = 0;
    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        const [code, link] = row.split(",").map((s: string) => s.trim());
        if (code && link) {
          insert.run(code.toUpperCase(), link);
          count++;
        }
      }
    });

    try {
      transaction(lines);
      res.json({ success: true, message: `${count} códigos importados com sucesso.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao processar o CSV." });
    }
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
