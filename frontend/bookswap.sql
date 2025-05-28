-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 28 mai 2025 à 19:16
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `bookswap`
--

-- --------------------------------------------------------

--
-- Structure de la table `book`
--

DROP TABLE IF EXISTS `book`;
CREATE TABLE IF NOT EXISTS `book` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `condition` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `description` text,
  `users_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `availability` enum('Disponible','Réservé','Echangé') NOT NULL DEFAULT 'Disponible',
  PRIMARY KEY (`id`),
  KEY `users_id` (`users_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `book`
--

INSERT INTO `book` (`id`, `title`, `author`, `category`, `condition`, `location`, `description`, `users_id`, `created_at`, `availability`) VALUES
(69, 'Harry Potter et la coupe de feu', 'J.K Rowling', 'Roman', 'Bon état', 'Osny (95)', 'Bonjour, je souhaiterais échanger contre le livre Harry Potter et l’Ordre du Phénix, s’il vous plaît. Je vous remercie par avance.\r\n(P.S. : Je m’excuse, mon chien a malheureusement mangé la page 24.)', 21, '2025-05-22 19:27:54', 'Disponible'),
(70, 'Star Wars, Épisode III : La Revanche des Sith', 'Matthew Stover', 'Roman', 'Usagé', 'Osny (95)', 'Bonjour à tous,\r\nJe viens de terminer le tome 3 et je suis à la recherche du tome 4.\r\nEn revanche, je tiens à m\'excuser : les pages 20, 21 et 22 sont malheureusement arrachées.', 21, '2025-05-23 16:45:22', 'Réservé'),
(82, 'La Curée', 'Émile Zola', 'Roman', 'Usagé', 'Osny (95)', '\"La Curée\" (publié en 1871) est le deuxième tome de la fresque Les Rougon-Macquart, une saga de 20 romans sur la société française sous le Second Empire. Le roman suit Aristide Rougon, devenu Aristide Saccard, un spéculateur immobilier à Paris, et explore l’avidité, la corruption, et le luxe ostentatoire de la bourgeoisie durant les grands travaux d’Haussmann. Sa femme Renée, personnage central, vit un drame intime dans un Paris en pleine mutation.', 21, '2025-05-26 14:11:05', 'Disponible'),
(86, 'Le Meilleur du Chat', 'Philippe Geluck', 'Bande dessinée', 'Neuf', 'Osny (95)', '\"Le Meilleur du Chat\" est une anthologie regroupant les meilleures planches de \"Le Chat\", célèbre personnage de bande dessinée créé par Philippe Geluck. Ce chat anthropomorphe en costume, pince-sans-rire et philosophe de l’absurde, livre des réflexions décalées sur la vie, la mort, la société, la politique ou les sciences, avec un humour souvent absurde et détonnant.', 21, '2025-05-27 13:53:10', 'Disponible'),
(87, 'Le Père Goriot', 'Honoré de Balzac', 'Roman', 'Bon état', 'Paris (75)', '\"Le Père Goriot\", publié en 1835, est l’un des romans les plus célèbres de La Comédie humaine, vaste fresque littéraire de Balzac. L’histoire se déroule à Paris dans une pension modeste, où vivent des personnages de toutes classes sociales. Parmi eux, Eugène de Rastignac, un jeune provincial ambitieux, et le père Goriot, vieillard ruiné par l’amour qu’il porte à ses filles ingrates.\r\n\r\nLe roman explore les thèmes de l’ascension sociale, de l’hypocrisie bourgeoise, de l’argent et des liens familiaux détruits par l’intérêt. Il s\'agit d\'une œuvre emblématique du réalisme balzacien, à la fois cruelle et poignante.', 22, '2025-05-27 13:56:46', 'Disponible'),
(88, 'Black Clover', 'Yuki Tabata', 'Manga', 'Neuf', 'Paris (75)', 'Black Clover suit l’histoire de Asta, un orphelin né sans pouvoir magique dans un monde où la magie est omniprésente et essentielle. Son rival et ami d’enfance, Yuno, est au contraire très doué. Tous deux rêvent de devenir Empereur-Mage, le plus grand magicien du royaume de Clover.\r\n\r\nMalgré son absence de magie, Asta obtient un grimoire à trèfle noir, rare et mystérieux, qui lui permet d’annuler les sorts. Le manga mêle combats spectaculaires, rivalités, amitiés et quêtes de dépassement de soi.', 22, '2025-05-27 15:14:55', 'Disponible'),
(89, 'Garfield lave plus blanc', 'Jim Davis', 'Bande dessinée', 'Neuf', 'Paris (75)', '\"Garfield lave plus blanc\" est l’un des nombreux tomes traduits en français des aventures du célèbre chat orange paresseux et sarcastique, Garfield. Dans cet album, comme à son habitude, Garfield multiplie les siestes, critique la nourriture (sauf les lasagnes), embête son maître Jon et martyrise le chien Odie.\r\n\r\nLe titre, avec son jeu de mots autour de la propreté, est ironique : Garfield est tout sauf un chat soigné, ce qui donne lieu à des gags absurdes autour de la toilette, du bain, ou du ménage.', 22, '2025-05-27 15:17:13', 'Disponible'),
(90, 'Culture Économique, Juridique et Managériale – BTS 1re année', 'Nathan Technique', 'Manuel scolaire', 'Très bon état', 'Versailles (78)', 'Ce manuel propose une approche claire et progressive de la CEJM (Culture Économique, Juridique et Managériale), matière commune à tous les BTS. Il est structuré autour des grandes thématiques du programme :\r\n\r\n- L’environnement économique de l’entreprise\r\n- Le cadre juridique de l’activité économique\r\n- Les fondements du management\r\n- La stratégie et l’organisation de l’entreprise', 28, '2025-05-27 15:30:12', 'Disponible'),
(91, 'Le Piano en 15 minutes par jour pour les Nuls', 'Mélanie Renaud', 'Apprentissage', 'Neuf', 'Versailles (78)', 'Ce manuel propose une méthode progressive sur 9 semaines, à raison de 15 minutes de pratique quotidienne, pour apprendre les bases du piano. Chaque semaine aborde de nouveaux rythmes, des lectures de notes, des exercices techniques et des écoutes musicales, le tout accompagné de pistes audio et de vidéos. La dernière partie du livre offre des partitions plus longues et complexes pour mettre en pratique les acquis.', 28, '2025-05-27 15:48:41', 'Disponible'),
(92, 'Germinal', 'Émile Zola', 'Roman', 'Très bon état', 'Versailles (78)', '\"Germinal\", publié en 1885, est le 13e volume de la fresque Les Rougon-Macquart. Il se déroule dans le nord de la France, au cœur du monde ouvrier des mines de charbon. Le roman suit Étienne Lantier, un jeune ouvrier sans travail qui devient mineur à Montsou et prend conscience de l’injustice sociale.\r\n\r\nProgressivement, il devient un leader syndical et déclenche une grève violente, dénonçant la misère, l’exploitation des travailleurs, les conditions de travail inhumaines et l’indifférence des classes dirigeantes.\r\n\r\nLe titre \"Germinal\" fait référence à un mois du calendrier républicain symbolisant la germination, l’espoir d’un renouveau social.', 28, '2025-05-27 15:53:27', 'Réservé');

-- --------------------------------------------------------

--
-- Structure de la table `book_images`
--

DROP TABLE IF EXISTS `book_images`;
CREATE TABLE IF NOT EXISTS `book_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `book_images`
--

INSERT INTO `book_images` (`id`, `book_id`, `image_path`, `created_at`) VALUES
(136, 69, '1748357787297-image_2025-05-27_165558825.png', '2025-05-27 14:56:27'),
(137, 69, '1748357787336-image_2025-05-27_165608158.png', '2025-05-27 14:56:27'),
(138, 69, '1748357787357-image_2025-05-27_165620066.png', '2025-05-27 14:56:27'),
(139, 70, '1748360546041-image_2025-05-27_173832169.png', '2025-05-27 15:42:26'),
(140, 70, '1748360546076-image_2025-05-27_174007294.png', '2025-05-27 15:42:26'),
(141, 82, '1748360867901-image_2025-05-27_174612108.png', '2025-05-27 15:47:47'),
(142, 82, '1748360867932-image_2025-05-27_174637871.png', '2025-05-27 15:47:47'),
(143, 86, '1748361190319-image_2025-05-27_175146088.png', '2025-05-27 15:53:10'),
(144, 86, '1748361190361-image_2025-05-27_175200008.png', '2025-05-27 15:53:10'),
(145, 87, '1748361406805-image_2025-05-27_175448998.png', '2025-05-27 15:56:46'),
(146, 87, '1748361406867-image_2025-05-27_175520516.png', '2025-05-27 15:56:46'),
(147, 87, '1748361406840-image_2025-05-27_175508286.png', '2025-05-27 15:56:46'),
(148, 88, '1748366095006-image_2025-05-27_191021456 (1).png', '2025-05-27 17:14:55'),
(149, 89, '1748366233494-image_2025-05-27_191616743.png', '2025-05-27 17:17:13'),
(150, 90, '1748367012435-IMG_20250527_164804.jpg', '2025-05-27 17:30:12'),
(151, 90, '1748367012440-image_2025-05-27_192731196.png', '2025-05-27 17:30:12'),
(152, 91, '1748368121189-image_2025-05-27_194601429.png', '2025-05-27 17:48:41'),
(153, 91, '1748368121225-image_2025-05-27_194616120.png', '2025-05-27 17:48:41'),
(154, 91, '1748368121247-image_2025-05-27_194630697.png', '2025-05-27 17:48:41'),
(155, 92, '1748368407736-image_2025-05-27_195036658.png', '2025-05-27 17:53:27'),
(156, 92, '1748368407761-image_2025-05-27_195107046.png', '2025-05-27 17:53:27'),
(157, 92, '1748368407778-image_2025-05-27_195213292.png', '2025-05-27 17:53:27');

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `book_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation_forward` (`user1_id`,`user2_id`,`book_id`),
  UNIQUE KEY `unique_conversation_reverse` (`user2_id`,`user1_id`,`book_id`),
  KEY `book_id` (`book_id`)
) ENGINE=MyISAM AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `conversations`
--

INSERT INTO `conversations` (`id`, `user1_id`, `user2_id`, `book_id`, `created_at`, `updated_at`) VALUES
(106, 22, 21, 70, '2025-05-27 16:51:57', '2025-05-27 16:51:57');

-- --------------------------------------------------------

--
-- Structure de la table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `book_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `user_id` (`user_id`,`book_id`),
  KEY `book_id` (`book_id`)
) ENGINE=MyISAM AUTO_INCREMENT=244 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `book_id`, `created_at`) VALUES
(216, 21, 69, '2025-05-28 12:45:10'),
(243, 21, 82, '2025-05-28 19:15:45'),
(233, 21, 92, '2025-05-28 16:25:19'),
(239, 21, 91, '2025-05-28 17:07:31');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `content` text,
  `image_url` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`)
) ENGINE=MyISAM AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `content`, `image_url`, `is_read`, `created_at`) VALUES
(109, 106, 21, 'Bonjour, oui, je vous le réserve', NULL, 1, '2025-05-27 16:53:38'),
(108, 106, 22, 'Bonjour, j\'ai le tome 4 qu\'il faut faut, toujours disponible ?', NULL, 1, '2025-05-27 16:53:03');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar` varchar(255) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `bio` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `created_at`, `avatar`, `location`, `bio`) VALUES
(21, 'Utilisateur1', 'Utilisateur1@gmail.com', '$2b$10$jg4y8Ax9wFk/HvkjBqFuR.XmL/ipQFj23QSCz2lFTp4sRu8ZaNcCW', '2025-05-22 19:08:55', '/uploads/avatar_21.jpg', 'Osny (95)', 'Bonjour à tous, je suis à votre disposition pour toute question concernant un livre qui vous intéresse, ou par email.  '),
(22, 'Utilisateur2', 'Utilisateur2@gmail.com', '$2b$10$CipXU4aEsdkUTkVqn6o1ZOOwSHNaeSSAG/RxrcTDKdOn0VlCnr32G', '2025-05-22 19:09:50', NULL, 'Paris (75)', ''),
(28, 'Utilisateur3', 'Utilisateur3@gmail.com', '$2b$10$CRvtqFx08ttDMDG5jeaE5uEjb2VsmaaFFv49Lh5zd7wlsIpqNb/ky', '2025-05-27 17:22:49', '/uploads/avatar_28.png', 'Versailles (78)', '');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `book`
--
ALTER TABLE `book`
  ADD CONSTRAINT `book_ibfk_1` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `book_images`
--
ALTER TABLE `book_images`
  ADD CONSTRAINT `book_images_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
