CREATE DATABASE IF NOT EXISTS `laporan_ekin_tahunan`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `laporan_ekin_tahunan`;

CREATE TABLE IF NOT EXISTS `report_metadata` (
  `id` INT NOT NULL DEFAULT 1 PRIMARY KEY,
  `year` INT NOT NULL DEFAULT 2026,
  `report_title` VARCHAR(255) NOT NULL DEFAULT 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
  `employee_name` VARCHAR(255) NOT NULL DEFAULT 'Muhammad Gusti Kurniawan, S.Kom',
  `nip` VARCHAR(100) NOT NULL DEFAULT '199308262025211037',
  `position` VARCHAR(255) NOT NULL DEFAULT 'Penata Layanan Operasional',
  `unit` VARCHAR(255) NOT NULL DEFAULT 'RSUD H. Abdul Manap Kota Jambi',
  `supervisor_name` VARCHAR(255) NOT NULL DEFAULT '',
  `supervisor_nip` VARCHAR(100) NOT NULL DEFAULT '',
  `city` VARCHAR(100) NOT NULL DEFAULT 'Jambi',
  `indicators` TEXT NULL,
  `selected_indicator` VARCHAR(500) NOT NULL DEFAULT 'Permintaan perbaikan perangkat keras/jaringan',
  `include_cover_page` TINYINT(1) NOT NULL DEFAULT 1,
  `include_empty_months` TINYINT(1) NOT NULL DEFAULT 0,
  `photos_per_page` INT NOT NULL DEFAULT 4,
  `paper_width_mm` INT NOT NULL DEFAULT 215,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `report_metadata` (
  `id`, `year`, `report_title`, `employee_name`, `nip`, `position`, `unit`,
  `supervisor_name`, `supervisor_nip`, `city`, `indicators`, `selected_indicator`,
  `include_cover_page`, `include_empty_months`, `photos_per_page`, `paper_width_mm`
) VALUES (
  1, 2026, 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
  'Muhammad Gusti Kurniawan, S.Kom', '199308262025211037',
  'Penata Layanan Operasional', 'RSUD H. Abdul Manap Kota Jambi',
  '', '', 'Jambi', '["Permintaan perbaikan perangkat keras/jaringan"]',
  'Permintaan perbaikan perangkat keras/jaringan', 1, 0, 4, 215
);

CREATE TABLE IF NOT EXISTS `evidence_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `year` INT NOT NULL DEFAULT 2026,
  `month` TINYINT NOT NULL,
  `indicator` VARCHAR(500) NOT NULL DEFAULT 'Permintaan perbaikan perangkat keras/jaringan',
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `date` VARCHAR(20) NULL,
  `image_data_url` LONGTEXT NOT NULL,
  `image_width` INT NOT NULL,
  `image_height` INT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` BIGINT NOT NULL,
  INDEX `idx_year_month_order` (`year`, `month`, `sort_order`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
