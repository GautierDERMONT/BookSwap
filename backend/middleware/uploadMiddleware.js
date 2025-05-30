const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Création du dossier 'uploads' si celui-ci n'existe pas, pour stocker les fichiers uploadés
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage des fichiers uploadés avec multer : destination et nommage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtrage des fichiers pour n'accepter que les images (vérification du type MIME)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

// Initialisation de multer avec la configuration de stockage, filtre et limites sur la taille et nombre de fichiers
const upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 20 * 1024 * 1024, // Taille max par fichier : 5 Mo
    files: 3 // Nombre max de fichiers uploadés simultanément : 3
  }
});

module.exports = upload;
