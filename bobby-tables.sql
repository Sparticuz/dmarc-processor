CREATE TABLE `report` (
	`serial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`mindate` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	`maxdate` TIMESTAMP NULL DEFAULT NULL,
	`domain` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`org` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`reportid` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`email` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`extra_contact_info` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`policy_adkim` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`policy_aspf` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`policy_p` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`policy_sp` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`policy_pct` TINYINT UNSIGNED NULL DEFAULT NULL,
	`raw_xml` MEDIUMTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`serial`) USING BTREE,
	UNIQUE INDEX `domain` (`domain`, `org`, `reportid`) USING BTREE
)
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
ROW_FORMAT=COMPRESSED;

CREATE TABLE `rptrecord` (
	`id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`serial` INT UNSIGNED NOT NULL,
	`ip` INT UNSIGNED NULL DEFAULT NULL,
	`ip6` BINARY(16) NULL DEFAULT NULL,
	`rcount` INT UNSIGNED NOT NULL,
	`disposition` ENUM('none','quarantine','reject','unknown') NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`reason` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`dkimdomain` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`dkimresult` ENUM('none','pass','fail','neutral','policy','temperror','permerror','unknown') NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`spfdomain` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`spfresult` ENUM('none','neutral','pass','fail','softfail','temperror','permerror','unknown') NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`spf_align` ENUM('fail','pass','unknown') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`dkim_align` ENUM('fail','pass','unknown') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`identifier_hfrom` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `serial` (`serial`, `ip`) USING BTREE,
	INDEX `serial6` (`serial`, `ip6`) USING BTREE
)
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB;
