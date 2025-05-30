# 📚 BookSwap

## Description  
**ZGM Book** est une application web qui permet aux utilisateurs d’échanger des livres facilement entre eux. Elle offre un espace pour consulter un catalogue, ajouter ses propres livres, discuter avec d'autres utilisateurs et gérer ses échanges.

---

## 🚀 Stack technique

- **Backend** : Node.js (avec Express) 
- **Frontend** : React  (avec Vite)
- **Base de données** : MySQL  
- **Authentification** : JWT (JSON Web Token)

---

## ⚙️ Installation

### Prérequis

- Node.js 
- MySQL  
- Git  
- Optionnel: WampServer (ou équivalent pour héberger MySQL en local)

---

### Étapes d'installation

1. **Cloner le dépôt :**

   ```bash
   git clone https://github.com/GautierDERMONT/bookswap.git
   ```

2. **Ouvrir deux terminaux en mode "Command Prompt"`CMD`** (éviter PowerShell).
   S'assurer dêtre dans le répertoire du projet bookswap, 
   un pour entrer dans le dossier `frontend`, l’autre dans `backend` :

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
   quelques vulnérabilités peuvent s'afficher mais c'est normal

4. **Base de donnée:**

 - Base donnée hébergé sur Railway, importation des tables grâce à MySQL Workbench


Optionnel: 
 - Configurer la base de données sur wamp(pour tester en local) :**

   - Assurez-vous que **Wamp** est lancé.
   - Vérifiez les fichiers de configuration :
     - `bookswap/backend/.env`
     - `bookswap/backend/config/db.js`
   - Créer une base de donnée "bookswap" et importer le fichier SQL pour initialiser la   base :

    [📥 Télécharger la BDD](/bookswap.sql)

---

## ▶️ Lancement des serveurs

1. **Lancer le serveur backend :**

   ```bash
   npm start
   ```
     ou
    ```bash
   node server.js
   ```
2. **Lancer le serveur frontend :**

   ```bash
   npm run dev
   ```

3. **Vous devriez voir les interfaces suivantes :**  
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
  ![Page Profile 1/2](/screenshots/Profile1.png)
  ![Page Profile 2/2](/screenshots/Profile2.png)

- **Favoris**  
![Page Favoris](/screenshots/favorites.png)

- **Livre**  
![Page détails du livre](/screenshots/bookdetails.png)

- **Ajout d’un livre**  
  ![Page Ajout 1/2](/screenshots/addbook1.png)
  ![Page Ajout 2/2](/screenshots/addbook2.png)


- **Messagerie**  
  ![Page messagerie](/screenshots/messagerie.png)

---

## 👨‍💻 Équipe projet

**Bachelor Informatique B3 – Groupe 3**

- Gautier DERMONT  
- Mennan SELVARUBAN  
- Zunaid MOUGAIDINESSAIB