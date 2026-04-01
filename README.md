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

### Une implémentation pédagogique complète de la technologie Blockchain

<br/>

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.2-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

[Démo](#-aperçu) • [Démarrage rapide](#-démarrage-rapide) • [API](#-api-endpoints) • [Architecture](#-architecture)

</div>

---

## Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Démarrage rapide](#-démarrage-rapide)
- [API Endpoints](#-api-endpoints)

---

## Fonctionnalités

### Blockchain Core
| Fonctionnalité | Description |
|---|---|
| **Chaîne de blocs** | Visualisation en temps réel de tous les blocs minés |
| **Structure des blocs** | Header (nonce, hash, merkle root), Body (transactions, coinbase) |
| **Explorateur** | Navigation complète dans les blocs et transactions |
| **Reset** | Réinitialisation de la chaîne pour les démonstrations |

### Minage & Consensus
| Fonctionnalité | Description |
|---|---|
| **Proof of Work** | Minage avec difficulté configurable (leading zeros) |
| **Consensus** | Validation par les nœuds du réseau avant ajout à la chaîne |
| **Merkle Tree** | Construction de l'arbre de Merkle pour l'intégrité des transactions |
| **Récompense mineurs** | Coinbase transaction automatique lors du minage |

### Wallet & Transactions
| Fonctionnalité | Description |
|---|---|
| **Gestion des wallets** | Création, consultation et gestion de multiple wallets |
| **Cryptographie ECDSA** | Paires clés privée/publique (secp256r1) |
| **Signature numérique** | Signature SHA256withECDSA des transactions |
| **Vérification** | Vérification de la validité d'une signature |
| **Faucet** | Distribution de BTC de test pour les démonstrations |
| **Mempool** | File d'attente des transactions en attente de minage |

### Éducatif
| Page | Description |
|---|---|
| **Hachage** | Démo interactive de SHA256 |
| **Signatures** | Explication visuelle ECDSA |
| **Internals** | Structure interne d'un bloc |
| **Dashboard** | Vue générale de la blockchain |
| **Balances** | Soldes de tous les comptes |

---



## Technologies utilisées

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| Java | 21 | Langage principal |
| Spring Boot | 3.4.2 | Framework REST API |
| Lombok | 1.18.36 | Réduction du boilerplate |
| Jackson | Latest | Sérialisation JSON (LocalDateTime) |
| Java Crypto | JDK built-in | ECDSA, SHA256, KeyPair generation |

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 18 | Framework UI |
| Vite | 5.x | Bundler & Dev Server |
| Framer Motion | Latest | Animations fluides |
| Lucide React | Latest | Icônes |
| Axios | Latest | Appels HTTP vers le backend |

---

## Démarrage rapide

### Prérequis

```bash
- Java 21+
- Node.js 18+
- Maven 3.8+
```

### 1- Cloner le projet

```bash
git clone https://github.com/MoustaphaSarr2024/site-blockchain.git
cd site-blockchain
```

### 2- Démarrer le Backend (Spring Boot)

```bash
# Depuis le dossier backend/
cd backend
./mvnw spring-boot:run

# Windows
cd backend
mvnw.cmd spring-boot:run
```

> Le serveur démarre sur **http://localhost:8080**

### 3- Démarrer le Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

> L'interface est accessible sur **http://localhost:5173**

---

## API Endpoints

### Blockchain

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blockchain` | Récupérer toute la chaîne |
| `POST` | `/api/blockchain/mine` | Miner un nouveau bloc |
| `DELETE` | `/api/blockchain/reset` | Réinitialiser la chaîne |
| `GET` | `/api/blockchain/mempool` | Transactions en attente |
| `POST` | `/api/blockchain/mempool` | Ajouter une transaction au mempool |
| `DELETE` | `/api/blockchain/mempool/{id}` | Supprimer une transaction du mempool |

### Wallets

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallets` | Lister tous les wallets |
| `POST` | `/api/wallets/create` | Créer un nouveau wallet |
| `POST` | `/api/wallets/send` | Envoyer des fonds |
| `POST` | `/api/wallets/faucet` | Obtenir des BTC de test |
| `POST` | `/api/wallets/sign` | Signer une transaction |
| `POST` | `/api/wallets/verify` | Vérifier une signature |

---


<div align="center">

### Projet pédagogique — UPHF-INSA Hauts-de-France 2025-2026

Développé à des fins éducatives pour comprendre les mécanismes fondamentaux de la technologie Blockchain.

**Moustapha Sarr** • [GitHub](https://github.com/MoustaphaSarr2024)

<br/>

* N'oubliez pas de me faire parvenir votre avis et ressenti!*

</div>
