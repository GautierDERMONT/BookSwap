# 📚 BookSwap

## Description  
**BookSwap** est une application web qui permet aux utilisateurs d’échanger des livres facilement entre eux. Elle offre un espace pour consulter un catalogue, ajouter ses propres livres, discuter avec d'autres utilisateurs et gérer ses échanges.

---

## 🚀 Stack technique

- **Backend** : Node.js  
- **Frontend** : React  
- **Base de données** : MySQL  
- **Authentification** : JWT (JSON Web Token)

---

## ⚙️ Installation

### Prérequis

- Node.js  
- MySQL  
- Git  
- WampServer (ou équivalent pour héberger MySQL en local)

---

### Étapes d'installation

1. **Cloner le dépôt :**

   ```bash
   git clone https://github.com/GautierDERMONT/bookswap.git
   ```

2. **Ouvrir deux terminaux en mode `CMD`** (éviter PowerShell).  
   L’un dans le dossier `frontend`, l’autre dans `backend` :

   ```bash
   cd frontend
   ```

   ```bash
   cd backend
   ```

3. **Installer les dépendances** dans les deux terminaux :  
   Dans chaque terminal :

   ```bash
   npm install
   ```

4. **Configurer la base de données :**

   - Assurez-vous que **Wamp** est lancé.
   - Vérifiez les fichiers de configuration :
     - `bookswap/backend/.env`
     - `bookswap/backend/config/db.js`
   - Créer une base de donnée "bookswap" et importer le fichier SQL pour initialiser la   base :

    [📥 Télécharger la BDD](/bookswap.sql)

---

## ▶️ Lancement des serveurs

1. **Démarrer Wamp**

2. **Lancer le serveur backend :**

   ```bash
   npm start
   ```

3. **Lancer le serveur frontend :**

   ```bash
   npm run dev
   ```

4. Vous devriez voir les interfaces suivantes :  
   - ![Lancement backend](/screenshots/start_backend.png)  
   - ![Lancement frontend](/screenshots/start_frontend.png)

---

## ✅ Fonctionnalités

- [x] Inscription / Connexion utilisateur  
- [x] Gestion du profil utilisateur  
- [x] Catalogue de livres  
- [x] Ajout de livres à échanger  
- [x] Recherche / Filtrage de livres  
- [x] Système de messagerie  
- [x] Ajout de livres en favoris  

---

## 🖼️ Captures d'écran

- **Page d'accueil**  
  ![Page d'accueil](/screenshots/home.png)

- **Filtrage des livres**  
  ![Filtrage](/screenshots/filters.png)

- **Profil utilisateur (1/2)**  
  ![Page Profile1](/screenshots/Profile1.png)

- **Profil utilisateur (2/2)**  
  ![Page Profile2](/screenshots/Profile2.png)

- **Favoris**  
![Page Favoris](/screenshots/favorites.png)

- **Livre**  
![Page détails du livre](/screenshots/bookdetails.png)

- **Ajout d’un livre**  
  ![Page Ajout](/screenshots/addbook.png)



- **Messagerie**  
  ![Page messagerie](/screenshots/messagerie.png)

---

## 👨‍💻 Équipe projet

**Bachelor Informatique B3 – Groupe 3**

- Gautier DERMONT  
- Mennan SELVARUBAN  
- Zunaid MOUGAIDINESSAIB