<div align="center">

<br/>

```
██████╗ ██╗      ██████╗  ██████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██████╔╝██║     ██║   ██║██║     █████╔╝ ██║     ███████║███████║██║██╔██╗ ██║
██╔══██╗██║     ██║   ██║██║     ██╔═██╗ ██║     ██╔══██║██╔══██║██║██║╚██╗██║
██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗╚██████╗██║  ██║██║  ██║██║██║ ╚████║
╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
```

### 🔗 Une implémentation pédagogique complète de la technologie Blockchain

<br/>

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.2-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

[📖 Démo](#-aperçu) • [🚀 Démarrage rapide](#-démarrage-rapide) • [📡 API](#-api-endpoints) • [🗂 Architecture](#-architecture)

</div>

---

## 📋 Table des matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🖥️ Aperçu de l'interface](#%EF%B8%8F-aperçu-de-linterface)
- [🗂 Architecture](#-architecture)
- [🔧 Technologies utilisées](#-technologies-utilisées)
- [🚀 Démarrage rapide](#-démarrage-rapide)
- [📡 API Endpoints](#-api-endpoints)
- [🔐 Cryptographie](#-cryptographie)
- [📁 Structure du projet](#-structure-du-projet)

---

## ✨ Fonctionnalités

### 🔗 Blockchain Core
| Fonctionnalité | Description |
|---|---|
| ⛓️ **Chaîne de blocs** | Visualisation en temps réel de tous les blocs minés |
| 🏗️ **Structure des blocs** | Header (nonce, hash, merkle root), Body (transactions, coinbase) |
| 🔍 **Explorateur** | Navigation complète dans les blocs et transactions |
| ♻️ **Reset** | Réinitialisation de la chaîne pour les démonstrations |

### ⛏️ Minage & Consensus
| Fonctionnalité | Description |
|---|---|
| 🎯 **Proof of Work** | Minage avec difficulté configurable (leading zeros) |
| 🤝 **Consensus** | Validation par les nœuds du réseau avant ajout à la chaîne |
| 🌳 **Merkle Tree** | Construction de l'arbre de Merkle pour l'intégrité des transactions |
| 🏆 **Récompense mineurs** | Coinbase transaction automatique lors du minage |

### 💰 Wallet & Transactions
| Fonctionnalité | Description |
|---|---|
| 👛 **Gestion des wallets** | Création, consultation et gestion de multiple wallets |
| 🔑 **Cryptographie ECDSA** | Paires clés privée/publique (secp256r1) |
| ✍️ **Signature numérique** | Signature SHA256withECDSA des transactions |
| ✅ **Vérification** | Vérification de la validité d'une signature |
| 🚰 **Faucet** | Distribution de BTC de test pour les démonstrations |
| 📤 **Mempool** | File d'attente des transactions en attente de minage |

### 📚 Éducatif
| Page | Description |
|---|---|
| 🔢 **Hachage** | Démo interactive de SHA256 |
| ✍️ **Signatures** | Explication visuelle ECDSA |
| 🧱 **Internals** | Structure interne d'un bloc |
| 📊 **Dashboard** | Vue générale de la blockchain |
| 💳 **Balances** | Soldes de tous les comptes |

---

## 🖥️ Aperçu de l'interface

```
┌─────────────────────────────────────────────────────────────────┐
│  ⛓️  BlockChain Explorer          🔗 Dashboard  💰 Wallet  ⛏️ Mine │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   📦 Block #42              📦 Block #41          📦 Block #40  │
│   Hash: 0000a3f...          Hash: 0000b7c...      Hash: 0000...│
│   Txns: 3  •  Nonce: 84712  Txns: 2  •  85.203   ← ← ← ←    │
│                                                                 │
│   ⛓ Chaîne valide  ✓     Dernière mise à jour: il y a 2 min   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                  │
│                                                               │
│  📊 Dashboard  🔗 Explorer  💰 Wallet  ⛏️ Mining  🤝 Consensus  │
│  📤 Mempool   🔢 Hash      ✍️ Sign    🧱 Internals            │
│                                                               │
│                    Axios HTTP Client                          │
└────────────────────────┬─────────────────────────────────────┘
                          │  REST API (JSON)
                          │  http://localhost:8080
┌─────────────────────────▼────────────────────────────────────┐
│                   BACKEND (Spring Boot 3)                      │
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ BlocController  │  │WalletCtrl    │  │  AuthController │ │
│  │ /api/blockchain │  │ /api/wallets │  │  /api/auth      │ │
│  └────────┬────────┘  └──────┬───────┘  └────────┬────────┘ │
│           │                  │                    │           │
│  ┌────────▼──────────────────▼────────────────────▼────────┐ │
│  │              Service Layer (BlocService + WalletService) │ │
│  └────────────────────────────┬──────────────────────────── ┘ │
│                               │                               │
│  ┌────────────────────────────▼──────────────────────────── ┐ │
│  │  Entities: Bloc · Header · Body · Transaction · Wallet   │ │
│  │  ECDSA secp256r1 · SHA256 · Merkle Tree · Mempool        │ │
│  └───────────────────────────────────────────────────────── ┘ │
│                                                               │
│                    📄 blockchain.json (persistence)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technologies utilisées

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| ☕ Java | 21 | Langage principal |
| 🍃 Spring Boot | 3.4.2 | Framework REST API |
| 🔧 Lombok | 1.18.36 | Réduction du boilerplate |
| 🗃️ Jackson | Latest | Sérialisation JSON (LocalDateTime) |
| 🔐 Java Crypto | JDK built-in | ECDSA, SHA256, KeyPair generation |

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| ⚛️ React | 18 | Framework UI |
| ⚡ Vite | 5.x | Bundler & Dev Server |
| 🎨 Framer Motion | Latest | Animations fluides |
| 🖼️ Lucide React | Latest | Icônes |
| 📡 Axios | Latest | Appels HTTP vers le backend |

---

## 🚀 Démarrage rapide

### Prérequis

```bash
✅ Java 21+
✅ Node.js 18+
✅ Maven 3.8+
```

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/MoustaphaSarr2024/site-blockchain.git
cd site-blockchain
```

### 2️⃣ Démarrer le Backend (Spring Boot)

```bash
# Depuis la racine du projet
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

> 🟢 Le serveur démarre sur **http://localhost:8080**

### 3️⃣ Démarrer le Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

> 🟢 L'interface est accessible sur **http://localhost:5173**

---

## 📡 API Endpoints

### 🔗 Blockchain

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blockchain` | Récupérer toute la chaîne |
| `POST` | `/api/blockchain/mine` | Miner un nouveau bloc |
| `DELETE` | `/api/blockchain/reset` | Réinitialiser la chaîne |
| `GET` | `/api/blockchain/mempool` | Transactions en attente |
| `POST` | `/api/blockchain/mempool` | Ajouter une transaction au mempool |
| `DELETE` | `/api/blockchain/mempool/{id}` | Supprimer une transaction du mempool |

### 💰 Wallets

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallets` | Lister tous les wallets |
| `POST` | `/api/wallets/create` | Créer un nouveau wallet |
| `POST` | `/api/wallets/send` | Envoyer des fonds |
| `POST` | `/api/wallets/faucet` | Obtenir des BTC de test |
| `POST` | `/api/wallets/sign` | Signer une transaction |
| `POST` | `/api/wallets/verify` | Vérifier une signature |

---

## 🔐 Cryptographie

Ce projet implémente une cryptographie similaire à Bitcoin :

```
🔑 Génération des clés
  └─► KeyPairGenerator (ECDSA secp256r1 / P-256)
        ├── Clé Privée → stockée côté serveur (jamais exposée)
        └── Clé Publique → envoyée au frontend (visible)

📬 Adresse du Wallet
  └─► SHA-256(Clé Publique) → adresse unique (hex)

✍️ Signature d'une Transaction
  └─► SHA256withECDSA(clé privée, données)
        └── Retourne une signature DER encodée en Base64/Hex

✅ Vérification
  └─► SHA256withECDSA.verify(clé publique, données, signature)
        └── true = signature valide ✓
```

> **Pourquoi la clé privée n'est pas visible ?**
> La clé privée est l'identité complète du wallet. Toute personne qui y a accès peut dépenser les fonds. Elle est donc gardée exclusivement côté serveur, jamais transmise au frontend.

---

## 📁 Structure du projet

```
site-blockchain/
├── 📄 pom.xml                          # Configuration Maven
├── 📄 blockchain.json                  # Persistance de la chaîne
│
├── 🗂️ src/main/java/com/uphf/blockchain/
│   ├── BlockChainApplication.java
│   ├── Controller/
│   │   ├── BlocController.java         # Routes blockchain & mempool
│   │   ├── WalletController.java       # Routes wallets & signatures
│   │   └── AuthController.java         # Routes authentification
│   ├── Service/
│   │   ├── BlocService.java            # Logique minage, merkle, PoW
│   │   └── WalletService.java          # Logique ECDSA, faucet, balances
│   ├── Entity/
│   │   ├── Bloc.java · Header.java · Body.java
│   │   ├── Transaction.java · CoinBase.java
│   │   ├── Wallet.java · WalletDTO.java
│   │   └── MerkleProof.java
│   └── DTO/
│
└── 🗂️ frontend/
    ├── 📄 package.json
    ├── 📄 vite.config.js
    └── src/
        ├── App.jsx                     # Router principal
        ├── api.js                      # Client HTTP Axios
        ├── index.css                   # Design system (variables CSS)
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── DashboardPage.jsx       # 📊 Vue générale
            ├── BlockchainExplorer.jsx  # 🔗 Explorateur de blocs
            ├── WalletPage.jsx          # 💰 Wallets & ECDSA
            ├── MiningPage.jsx          # ⛏️ Minage PoW
            ├── MempoolPage.jsx         # 📤 Mempool
            ├── ConsensusPage.jsx       # 🤝 Consensus réseau
            ├── TransactionPage.jsx     # 💸 Transactions
            ├── SignaturePage.jsx       # ✍️ Signatures numériques
            ├── HashPage.jsx            # 🔢 Hachage SHA256
            ├── InternalsPage.jsx       # 🧱 Structure d'un bloc
            ├── BasicsPage.jsx          # 📚 Les bases
            ├── BalancesPage.jsx        # 💳 Soldes des comptes
            └── AccountsPage.jsx        # 👤 Comptes
```

---

<div align="center">

### 🎓 Projet pédagogique — UPHF

Développé à des fins éducatives pour comprendre les mécanismes fondamentaux de la technologie Blockchain.

**Moustapha Sarr** • [GitHub](https://github.com/MoustaphaSarr2024)

<br/>

*⭐ N'oublie pas de mettre une étoile si ce projet t'a été utile !*

</div>
