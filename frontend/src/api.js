import axios from 'axios';

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" }
});

// ==================== BLOC API ====================
export const apiBloc = {
  generer: () => api.get("/bloc/generer"),
  // Minage avec adresse du mineur (POST)
  miner: (minerAddress, target) => api.post("/bloc/miner", { minerAddress, target }),
  // Minage rapide sans wallet (GET)
  minerRapide: () => api.get("/bloc/miner"),
  // Blockchain complète
  getBlockchain: () => api.get("/bloc/blockchain"),
  resetBlockchain: () => api.delete("/bloc/blockchain"),
  saveBlockchain: () => api.post("/bloc/blockchain/save"),
  loadBlockchain: () => api.post("/bloc/blockchain/load"),
  // Mempool
  getMempool: () => api.get("/bloc/mempool"),
  deleteFromMempool: (index) => api.delete(`/bloc/mempool/${index}`),
  clearMempool: () => api.delete("/bloc/mempool"),
};

// ==================== WALLET API ====================
export const apiWallet = {
  // Créer un wallet
  create: (label) => api.post("/wallet", { label }),

  // Lister tous les wallets
  getAll: () => api.get("/wallet"),

  // Détails d'un wallet
  getOne: (address) => api.get(`/wallet/${address}`),

  // Solde d'un wallet
  getBalance: (address) => api.get(`/wallet/${address}/balance`),

  // Faucet : créditer un wallet avec des BTC de test
  faucet: (address, montant = 1.0) => api.post(`/wallet/${address}/faucet`, { montant }),

  // Signer une transaction
  sign: (address, destinataire, quantite) =>
    api.post(`/wallet/${address}/sign`, { destinataire, quantite }),

  // Vérifier une signature
  verify: (publicKey, expediteur, destinataire, quantite, signature) =>
    api.post("/wallet/verify", { publicKey, expediteur, destinataire, quantite, signature }),

  // Envoyer des fonds (ajoute au mempool)
  send: (address, destinataire, montant, fees = 0) =>
    api.post(`/wallet/${address}/send`, { destinataire, montant, fees }),

  // Signer un message libre
  signMessage: (address, message) =>
    api.post(`/wallet/${address}/signMessage`, { message }),

  // Vérifier la signature d'un message libre
  verifyMessage: (publicKey, message, signature) =>
    api.post(`/wallet/verifyMessage`, { publicKey, message, signature }),
};
// ==================== AUTH API ====================
export const apiAuth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (email, password) => api.post("/auth/register", { email, password }),
};

export default api;