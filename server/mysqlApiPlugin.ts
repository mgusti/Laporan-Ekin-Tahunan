import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import mysql from 'mysql2/promise';
import type { Plugin } from 'vite';

const DEFAULT_IND = 'Permintaan perbaikan perangkat keras/jaringan';

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'laporan_ekin_tahunan',
};

let pool: mysql.Pool | null = null;
let initPromise: Promise<void> | null = null;
let yearColumnEnsured = false;

async function ensureDatabaseInitialized(): Promise<mysql.Pool> {
  if (pool && initPromise) {
    try {
      await initPromise;
      await pool.query('SELECT 1');
      if (!yearColumnEnsured) {
        await pool
          .query(
            'ALTER TABLE `evidence_items` ADD COLUMN `year` INT NOT NULL DEFAULT 2026 AFTER `id`'
          )
          .catch(() => {});
        yearColumnEnsured = true;
      }
      return pool;
    } catch {
      try {
        await pool.end();
      } catch {
        // Ignore pool close errors
      }
      pool = null;
      initPromise = null;
    }
  }

  initPromise = (async () => {
    try {
      const bootstrapConn = await mysql.createConnection({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
      });

    try {
      await bootstrapConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await bootstrapConn.query('SET GLOBAL max_allowed_packet = 67108864').catch(() => {
        // Ignore if user lacks SUPER privilege
      });
    } finally {
      await bootstrapConn.end();
    }

    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`report_metadata\` (
        \`id\` INT NOT NULL DEFAULT 1 PRIMARY KEY,
        \`year\` INT NOT NULL DEFAULT 2026,
        \`report_title\` VARCHAR(255) NOT NULL DEFAULT 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
        \`employee_name\` VARCHAR(255) NOT NULL DEFAULT 'Muhammad Gusti Kurniawan, S.Kom',
        \`nip\` VARCHAR(100) NOT NULL DEFAULT '199308262025211037',
        \`position\` VARCHAR(255) NOT NULL DEFAULT 'Penata Layanan Operasional',
        \`unit\` VARCHAR(255) NOT NULL DEFAULT 'RSUD H. Abdul Manap Kota Jambi',
        \`supervisor_name\` VARCHAR(255) NOT NULL DEFAULT '',
        \`supervisor_nip\` VARCHAR(100) NOT NULL DEFAULT '',
        \`city\` VARCHAR(100) NOT NULL DEFAULT 'Jambi',
        \`indicators\` TEXT NULL,
        \`selected_indicator\` VARCHAR(500) NOT NULL DEFAULT 'Permintaan perbaikan perangkat keras/jaringan',
        \`include_cover_page\` TINYINT(1) NOT NULL DEFAULT 1,
        \`include_empty_months\` TINYINT(1) NOT NULL DEFAULT 0,
        \`photos_per_page\` INT NOT NULL DEFAULT 4,
        \`paper_width_mm\` INT NOT NULL DEFAULT 215,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure new columns exist on existing report_metadata table
    await pool
      .query('ALTER TABLE `report_metadata` ADD COLUMN `indicators` TEXT NULL AFTER `city`')
      .catch(() => {});
    await pool
      .query(
        `ALTER TABLE \`report_metadata\` ADD COLUMN \`selected_indicator\` VARCHAR(500) NOT NULL DEFAULT '${DEFAULT_IND}' AFTER \`indicators\``
      )
      .catch(() => {});

    await pool.query(
      `INSERT IGNORE INTO \`report_metadata\` (
        \`id\`, \`year\`, \`report_title\`, \`employee_name\`, \`nip\`, \`position\`, \`unit\`,
        \`supervisor_name\`, \`supervisor_nip\`, \`city\`, \`indicators\`, \`selected_indicator\`,
        \`include_cover_page\`, \`include_empty_months\`, \`photos_per_page\`, \`paper_width_mm\`
      ) VALUES (
        1, 2026, 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
        'Muhammad Gusti Kurniawan, S.Kom', '199308262025211037',
        'Penata Layanan Operasional', 'RSUD H. Abdul Manap Kota Jambi',
        '', '', 'Jambi', ?, ?, 1, 0, 4, 215
      )`,
      [JSON.stringify([DEFAULT_IND]), DEFAULT_IND]
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`evidence_items\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`year\` INT NOT NULL DEFAULT 2026,
        \`month\` TINYINT NOT NULL,
        \`indicator\` VARCHAR(500) NOT NULL DEFAULT 'Permintaan perbaikan perangkat keras/jaringan',
        \`title\` VARCHAR(500) NOT NULL,
        \`description\` TEXT NULL,
        \`date\` VARCHAR(20) NULL,
        \`image_data_url\` LONGTEXT NOT NULL,
        \`image_width\` INT NOT NULL,
        \`image_height\` INT NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` BIGINT NOT NULL,
        INDEX \`idx_year_month_order\` (\`year\`, \`month\`, \`sort_order\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure year and indicator columns exist on existing evidence_items table
    await pool
      .query(
        'ALTER TABLE `evidence_items` ADD COLUMN `year` INT NOT NULL DEFAULT 2026 AFTER `id`'
      )
      .catch(() => {});
    await pool
      .query(
        `ALTER TABLE \`evidence_items\` ADD COLUMN \`indicator\` VARCHAR(500) NOT NULL DEFAULT '${DEFAULT_IND}' AFTER \`month\``
      )
      .catch(() => {});
    } catch (err) {
      if (pool) {
        try {
          await pool.end();
        } catch {
          // Ignore pool close errors
        }
      }
      pool = null;
      initPromise = null;
      throw err;
    }
  })();

  await initPromise;
  return pool!;
}

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function parseIndicatorsList(raw: unknown): string[] {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      // Fallback to default
    }
  }
  return [DEFAULT_IND];
}

async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] ?? '';
  if (url !== '/api/report') {
    return false;
  }

  try {
    const db = await ensureDatabaseInitialized();

    if (req.method === 'GET') {
      const [metaRows] = await db.query<mysql.RowDataPacket[]>(
        'SELECT * FROM `report_metadata` WHERE `id` = 1 LIMIT 1'
      );
      const [itemRows] = await db.query<mysql.RowDataPacket[]>(
        'SELECT * FROM `evidence_items` ORDER BY `year` ASC, `month` ASC, `sort_order` ASC, `created_at` ASC'
      );

      const m = metaRows[0];
      const parsedIndicators = m ? parseIndicatorsList(m.indicators) : [DEFAULT_IND];
      const items = itemRows.map((row) => {
        const ind = String(row.indicator ?? '').trim() || parsedIndicators[0] || DEFAULT_IND;
        if (!parsedIndicators.includes(ind)) {
          parsedIndicators.push(ind);
        }
        return {
          id: String(row.id),
          year: Number(row.year) || 2026,
          month: Number(row.month),
          indicator: ind,
          title: String(row.title ?? ''),
          description: row.description ? String(row.description) : undefined,
          date: row.date ? String(row.date) : undefined,
          imageDataUrl: String(row.image_data_url),
          imageWidth: Number(row.image_width),
          imageHeight: Number(row.image_height),
          order: Number(row.sort_order),
          createdAt: Number(row.created_at),
        };
      });

      const rawSelected = m ? String(m.selected_indicator ?? '').trim() : '';
      const selectedIndicator =
        rawSelected === '__ALL_INDICATORS__' || parsedIndicators.includes(rawSelected)
          ? rawSelected
          : parsedIndicators[0] || DEFAULT_IND;

      const metadata = m
        ? {
            year: Number(m.year),
            reportTitle: String(m.report_title ?? ''),
            employeeName: String(m.employee_name ?? ''),
            nip: String(m.nip ?? ''),
            position: String(m.position ?? ''),
            unit: String(m.unit ?? ''),
            supervisorName: String(m.supervisor_name ?? ''),
            supervisorNip: String(m.supervisor_nip ?? ''),
            city: String(m.city ?? ''),
            indicators: parsedIndicators,
            selectedIndicator,
            includeCoverPage: Boolean(m.include_cover_page),
            includeEmptyMonths: Boolean(m.include_empty_months),
            photosPerPage: (Number(m.photos_per_page) as 2 | 4 | 6) || 4,
            paperWidthMm: (Number(m.paper_width_mm) as 210 | 215) || 215,
          }
        : null;

      sendJson(res, 200, { metadata, items });
      return true;
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const { metadata, items } = body;

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        if (metadata) {
          const indicatorsList =
            Array.isArray(metadata.indicators) && metadata.indicators.length > 0
              ? metadata.indicators.map((x: any) => String(x).trim()).filter(Boolean)
              : [DEFAULT_IND];
          const selectedIndicator =
            String(metadata.selectedIndicator ?? '').trim() || indicatorsList[0] || DEFAULT_IND;

          await conn.query(
            `INSERT INTO \`report_metadata\` (
              \`id\`, \`year\`, \`report_title\`, \`employee_name\`, \`nip\`, \`position\`, \`unit\`,
              \`supervisor_name\`, \`supervisor_nip\`, \`city\`, \`indicators\`, \`selected_indicator\`,
              \`include_cover_page\`, \`include_empty_months\`, \`photos_per_page\`, \`paper_width_mm\`
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`year\` = VALUES(\`year\`),
              \`report_title\` = VALUES(\`report_title\`),
              \`employee_name\` = VALUES(\`employee_name\`),
              \`nip\` = VALUES(\`nip\`),
              \`position\` = VALUES(\`position\`),
              \`unit\` = VALUES(\`unit\`),
              \`supervisor_name\` = VALUES(\`supervisor_name\`),
              \`supervisor_nip\` = VALUES(\`supervisor_nip\`),
              \`city\` = VALUES(\`city\`),
              \`indicators\` = VALUES(\`indicators\`),
              \`selected_indicator\` = VALUES(\`selected_indicator\`),
              \`include_cover_page\` = VALUES(\`include_cover_page\`),
              \`include_empty_months\` = VALUES(\`include_empty_months\`),
              \`photos_per_page\` = VALUES(\`photos_per_page\`),
              \`paper_width_mm\` = VALUES(\`paper_width_mm\`)`,
            [
              Number(metadata.year) || 2026,
              String(metadata.reportTitle ?? ''),
              String(metadata.employeeName ?? ''),
              String(metadata.nip ?? ''),
              String(metadata.position ?? ''),
              String(metadata.unit ?? ''),
              String(metadata.supervisorName ?? ''),
              String(metadata.supervisorNip ?? ''),
              String(metadata.city ?? ''),
              JSON.stringify(indicatorsList),
              selectedIndicator,
              metadata.includeCoverPage ? 1 : 0,
              metadata.includeEmptyMonths ? 1 : 0,
              Number(metadata.photosPerPage) || 4,
              Number(metadata.paperWidthMm) || 215,
            ]
          );
        }

        if (Array.isArray(items)) {
          if (items.length === 0) {
            await conn.query('DELETE FROM `evidence_items`');
          } else {
            const ids = items.map((i: any) => String(i.id));
            await conn.query('DELETE FROM `evidence_items` WHERE `id` NOT IN (?)', [ids]);

            for (const item of items) {
              const itemYear = Number(item.year) || Number(metadata?.year) || 2026;
              const itemIndicator = String(item.indicator ?? '').trim() || DEFAULT_IND;
              if (item.imageDataUrl === '__KEEP__') {
                await conn.query(
                  `UPDATE \`evidence_items\`
                   SET \`year\` = ?, \`month\` = ?, \`indicator\` = ?, \`title\` = ?, \`description\` = ?, \`date\` = ?,
                       \`image_width\` = ?, \`image_height\` = ?, \`sort_order\` = ?, \`created_at\` = ?
                   WHERE \`id\` = ?`,
                  [
                    itemYear,
                    Number(item.month),
                    itemIndicator,
                    String(item.title ?? ''),
                    item.description ?? null,
                    item.date ?? null,
                    Number(item.imageWidth) || 0,
                    Number(item.imageHeight) || 0,
                    Number(item.order) || 0,
                    Number(item.createdAt) || Date.now(),
                    String(item.id),
                  ]
                );
              } else {
                await conn.query(
                  `INSERT INTO \`evidence_items\` (
                    \`id\`, \`year\`, \`month\`, \`indicator\`, \`title\`, \`description\`, \`date\`,
                    \`image_data_url\`, \`image_width\`, \`image_height\`, \`sort_order\`, \`created_at\`
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    \`year\` = VALUES(\`year\`),
                    \`month\` = VALUES(\`month\`),
                    \`indicator\` = VALUES(\`indicator\`),
                    \`title\` = VALUES(\`title\`),
                    \`description\` = VALUES(\`description\`),
                    \`date\` = VALUES(\`date\`),
                    \`image_data_url\` = VALUES(\`image_data_url\`),
                    \`image_width\` = VALUES(\`image_width\`),
                    \`image_height\` = VALUES(\`image_height\`),
                    \`sort_order\` = VALUES(\`sort_order\`),
                    \`created_at\` = VALUES(\`created_at\`)`,
                  [
                    String(item.id),
                    itemYear,
                    Number(item.month),
                    itemIndicator,
                    String(item.title ?? ''),
                    item.description ?? null,
                    item.date ?? null,
                    String(item.imageDataUrl ?? ''),
                    Number(item.imageWidth) || 0,
                    Number(item.imageHeight) || 0,
                    Number(item.order) || 0,
                    Number(item.createdAt) || Date.now(),
                  ]
                );
              }
            }
          }
        }

        await conn.commit();
        sendJson(res, 200, { ok: true });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
      return true;
    }

    if (req.method === 'DELETE') {
      await db.query('DELETE FROM `evidence_items`');
      await db.query(
        `UPDATE \`report_metadata\`
         SET \`report_title\` = 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
             \`employee_name\` = '',
             \`nip\` = '',
             \`position\` = '',
             \`unit\` = '',
             \`supervisor_name\` = '',
             \`supervisor_nip\` = '',
             \`city\` = '',
             \`indicators\` = ?,
             \`selected_indicator\` = ?,
             \`include_cover_page\` = 1,
             \`include_empty_months\` = 0,
             \`photos_per_page\` = 4,
             \`paper_width_mm\` = 215
         WHERE \`id\` = 1`,
        [JSON.stringify([DEFAULT_IND]), DEFAULT_IND]
      );
      sendJson(res, 200, { ok: true });
      return true;
    }

    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  } catch (err: any) {
    console.error('[MySQL API Error]:', err);
    const code = typeof err?.code === 'string' ? err.code : 'DB_CONNECTION_ERROR';
    const rawMsg = err instanceof Error ? err.message : 'Database error';
    const isConnRefused =
      code === 'ECONNREFUSED' ||
      code === 'PROTOCOL_CONNECTION_LOST' ||
      code === 'ETIMEDOUT' ||
      rawMsg.includes('ECONNREFUSED');

    const friendlyMessage = isConnRefused
      ? `Tidak dapat terhubung ke server MySQL di ${DB_CONFIG.host}:${DB_CONFIG.port} (${code}). Pastikan layanan MySQL (C:\\wamp64\\bin\\mysql\\mysql8.4.13) pada WAMP Server sudah aktif.`
      : `Kesalahan database MySQL (${code}): ${rawMsg}`;

    sendJson(res, 503, {
      error: friendlyMessage,
      code,
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      database: DB_CONFIG.database,
    });
    return true;
  }
}

export function mysqlApiPlugin(): Plugin {
  return {
    name: 'mysql-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) next();
      });
    },
  };
}
