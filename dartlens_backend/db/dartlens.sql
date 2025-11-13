-- -------------------------------------------------------------
-- TablePlus 6.7.3(640)
--
-- https://tableplus.com/
--
-- Database: dartlens
-- Generation Time: 2025-11-13 16:50:24.2650
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


CREATE TABLE `api_call_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(128) NOT NULL,
  `corp_code` char(8) DEFAULT NULL,
  `params` json DEFAULT NULL,
  `status` int DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `error_msg` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_api_corp` (`corp_code`),
  KEY `ix_api_ep` (`endpoint`,`created_at`),
  KEY `ix_api_created` (`created_at`),
  KEY `ix_api_ep_time` (`endpoint`,`created_at`),
  KEY `ix_api_corp_time` (`corp_code`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12906 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `applied_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `corp_basic` (
  `corp_code` char(8) NOT NULL,
  `corp_name` varchar(255) NOT NULL,
  `corp_eng_name` varchar(255) DEFAULT NULL,
  `stock_code` char(6) DEFAULT NULL,
  `listed` tinyint(1) NOT NULL DEFAULT '0',
  `modify_date` date DEFAULT NULL,
  `last_sync_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`corp_code`),
  KEY `ix_stock` (`stock_code`),
  KEY `ix_listed` (`listed`),
  KEY `ix_listed_stock` (`listed`,`stock_code`),
  KEY `ix_cb_listed_name_code` (`listed`,`corp_name`,`corp_code`,`stock_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `corp_basic_stage` (
  `corp_code` char(8) NOT NULL,
  `corp_name` varchar(255) NOT NULL,
  `stock_code` char(6) DEFAULT NULL,
  `listed` tinyint(1) NOT NULL DEFAULT '0',
  `seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`corp_code`),
  KEY `ix_cbs_listed_code` (`listed`,`corp_code`),
  KEY `ix_cbs_name` (`corp_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `corp_outline` (
  `corp_code` char(8) NOT NULL,
  `stock_code` char(6) DEFAULT NULL,
  `corp_name` varchar(255) DEFAULT NULL,
  `business_overview` mediumtext,
  `main_products` mediumtext,
  `last_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`corp_code`),
  KEY `ix_outline_stock` (`stock_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dashboard_prefs` (
  `user_id` bigint unsigned NOT NULL,
  `layout` json DEFAULT NULL,
  `filters` json DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_prefs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `financial_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `corp_code` char(8) NOT NULL,
  `stock_code` char(6) DEFAULT NULL,
  `corp_name` varchar(255) DEFAULT NULL,
  `bsns_year` char(4) NOT NULL,
  `reprt_code` char(5) NOT NULL,
  `fs_div` enum('CFS','OFS') DEFAULT 'CFS',
  `account_id` varchar(191) NOT NULL,
  `account_nm` varchar(255) DEFAULT NULL,
  `thstrm_amount` varchar(64) DEFAULT NULL,
  `frmtrm_amount` varchar(64) DEFAULT NULL,
  `ord` smallint DEFAULT NULL,
  `last_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fact` (`corp_code`,`bsns_year`,`reprt_code`,`fs_div`,`account_id`),
  KEY `ix_fact_corp` (`corp_code`,`bsns_year`),
  KEY `ix_fr_year` (`bsns_year`),
  KEY `ix_fr_year_repr_fs` (`bsns_year`,`reprt_code`,`fs_div`),
  KEY `ix_fr_cov` (`bsns_year`,`reprt_code`,`fs_div`,`corp_code`)
) ENGINE=InnoDB AUTO_INCREMENT=462111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `fr_yearly_coverage` (
  `bsns_year` char(4) NOT NULL,
  `reprt_code` char(5) NOT NULL,
  `fs_div` enum('CFS','OFS') NOT NULL DEFAULT 'CFS',
  `corps_loaded` int NOT NULL DEFAULT '0',
  `rows_loaded` bigint NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`bsns_year`,`reprt_code`,`fs_div`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ingest_run_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` timestamp NULL DEFAULT NULL,
  `years_json` json NOT NULL,
  `reprt_code` char(5) NOT NULL,
  `fs_div` enum('CFS','OFS') NOT NULL DEFAULT 'CFS',
  `only_new` tinyint(1) NOT NULL DEFAULT '1',
  `resume` tinyint(1) NOT NULL DEFAULT '0',
  `processed` int NOT NULL DEFAULT '0',
  `status` enum('RUNNING','OK','ERROR') NOT NULL DEFAULT 'RUNNING',
  `error_msg` text,
  PRIMARY KEY (`id`),
  KEY `ix_ingest_status` (`status`,`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sync_state` (
  `name` varchar(128) NOT NULL,
  `last_hash` char(32) DEFAULT NULL,
  `last_sync_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `marketing` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wishlist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `corp_code` varchar(20) NOT NULL,
  `alias` varchar(60) DEFAULT NULL,
  `priority` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_corp` (`user_id`,`corp_code`),
  UNIQUE KEY `uq_wishlist_user_corp` (`user_id`,`corp_code`),
  KEY `ix_user` (`user_id`),
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;