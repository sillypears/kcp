CREATE TABLE `boxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(10) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `maker_name` varchar(100) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `dedicated` tinyint(1) DEFAULT 0,
  `allow_add` tinyint(1) DEFAULT 1,
  `allow_duplicates` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `makers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `maker_name` varchar(255) NOT NULL,
  `maker_name_clean` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `maker_name` (`maker_name`)
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `keycaps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `maker_id` int(11) DEFAULT NULL,
  `cell_x` int(2) DEFAULT NULL,
  `cell_y` int(2) DEFAULT NULL,
  `sculpt` varchar(255) NOT NULL,
  `sculpt_clean` varchar(45) DEFAULT NULL,
  `colorway` varchar(255) DEFAULT NULL,
  `box_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cap` (`maker_id`,`sculpt`,`colorway`),
  KEY `fk_keycap_box` (`box_id`),
  CONSTRAINT `fk_keycap_box` FOREIGN KEY (`box_id`) REFERENCES `boxes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_keycap_maker` FOREIGN KEY (`maker_id`) REFERENCES `makers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=597 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE ALGORITHM=UNDEFINED DEFINER=`blap`@`%` SQL SECURITY DEFINER VIEW `all_keycaps` AS select `k`.`id` AS `id`,`k`.`maker_id` AS `maker_id`,`m`.`maker_name` AS `maker_name`,`k`.`sculpt` AS `sculpt`,concat(`m`.`maker_name_clean`,replace(`k`.`sculpt`,' ','_')) AS `unique_id`,`k`.`colorway` AS `colorway`,`k`.`box_id` AS `box_id`,`b`.`label` AS `label` from ((`keycaps` `k` left join `makers` `m` on(`m`.`id` = `k`.`maker_id`)) left join `boxes` `b` on(`b`.`id` = `k`.`box_id`));
