package com.uphf.blockchain.Service;

import com.uphf.blockchain.Entity.Transaction;
import com.uphf.blockchain.Entity.Wallet;
import com.uphf.blockchain.Entity.WalletDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

@Service
public class WalletService {

    @Autowired
    private BlocService blocService;

    // Stockage en mémoire des wallets (clé = adresse)
    private final Map<String, Wallet> wallets = new HashMap<>();

    /**
     * Créer un nouveau wallet avec une paire de clés ECDSA
     */
    public WalletDTO creerWallet(String label) {
        try {
            // Générer la paire de clés ECDSA (courbe secp256r1)
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
            keyGen.initialize(new ECGenParameterSpec("secp256r1"));
            KeyPair keyPair = keyGen.generateKeyPair();

            // Convertir les clés en hex
            String privateKeyHex = bytesToHex(keyPair.getPrivate().getEncoded());
            String publicKeyHex = bytesToHex(keyPair.getPublic().getEncoded());

            // Dériver l'adresse (hash SHA-256 de la clé publique, tronqué à 40 chars)
            String address = genererAdresse(publicKeyHex);

            // Créer et stocker le wallet
            Wallet wallet = new Wallet(privateKeyHex, publicKeyHex, address, label);
            wallets.put(address, wallet);

            // Retourner le DTO (sans clé privée)
            return WalletDTO.fromWallet(wallet, 0.0);

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la création du wallet: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer un wallet par son adresse (sans la clé privée)
     */
    public WalletDTO getWallet(String address) {
        Wallet wallet = wallets.get(address);
        if (wallet == null) {
            throw new RuntimeException("Wallet introuvable pour l'adresse: " + address);
        }
        Double balance = calculerBalance(address);
        return WalletDTO.fromWallet(wallet, balance);
    }

    /**
     * Liste tous les wallets (sans les clés privées)
     */
    public List<WalletDTO> getAllWallets() {
        List<WalletDTO> dtoList = new ArrayList<>();
        for (Wallet wallet : wallets.values()) {
            Double balance = calculerBalance(wallet.getAddress());
            dtoList.add(WalletDTO.fromWallet(wallet, balance));
        }
        return dtoList;
    }

    /**
     * Calculer le solde d'un wallet en parcourant les transactions confirmées
     * (celles des blocs minés) + les transactions coinbase (récompenses de minage)
     */
    public Double calculerBalance(String address) {
        double balance = 0.0;
        List<Transaction> confirmedTxs = blocService.getTransactionsConfirmees();
        for (Transaction tx : confirmedTxs) {
            // Si le wallet est destinataire, on ajoute
            if (address.equals(tx.getDestinataire())) {
                balance += tx.getQuantite();
            }
            // Si le wallet est expéditeur, on soustrait (quantité + fees)
            if (address.equals(tx.getExpediteur())) {
                balance -= tx.getQuantite();
                if (tx.getFees() != null) {
                    balance -= tx.getFees();
                }
            }
        }
        return balance;
    }

    /**
     * Faucet : créditer un wallet avec des BTC de test.
     * Crée une transaction FAUCET → wallet et la confirme immédiatement
     * via un mini-minage.
     */
    public WalletDTO faucet(String address, Double montant) {
        Wallet wallet = wallets.get(address);
        if (wallet == null) {
            throw new RuntimeException("Wallet introuvable pour l'adresse: " + address);
        }
        if (montant <= 0) {
            throw new RuntimeException("Le montant doit être positif");
        }

        // Créer une transaction faucet (pas de signature nécessaire)
        Transaction faucetTx = new Transaction("FAUCET", address, montant);
        faucetTx.setSignature("FAUCET_NO_SIGNATURE");

        // Ajouter directement au mempool puis miner immédiatement
        blocService.ajouterAuMempool(faucetTx);
        blocService.minerBloc(null); // Pas de mineur spécifique pour le faucet

        Double newBalance = calculerBalance(address);
        return WalletDTO.fromWallet(wallet, newBalance);
    }

    /**
     * Signer une transaction avec la clé privée d'un wallet
     */
    public String signerTransaction(String address, Transaction transaction) {
        Wallet wallet = wallets.get(address);
        if (wallet == null) {
            throw new RuntimeException("Wallet introuvable pour l'adresse: " + address);
        }

        try {
            // Reconstruire la clé privée à partir du hex
            byte[] privateKeyBytes = hexToBytes(wallet.getPrivateKey());
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

            // Données à signer
            String donnees = transaction.getExpediteur()
                    + transaction.getDestinataire()
                    + String.format("%.9f", transaction.getQuantite());

            // Signer avec SHA256withECDSA
            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(privateKey);
            signature.update(donnees.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signature.sign();

            String signatureHex = bytesToHex(signatureBytes);

            // Mettre à jour la signature de la transaction
            transaction.setSignature(signatureHex);

            return signatureHex;

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la signature: " + e.getMessage(), e);
        }
    }

    /**
     * Vérifier la signature d'une transaction
     */
    public boolean verifierSignature(String publicKeyHex, Transaction transaction, String signatureHex) {
        try {
            // Reconstruire la clé publique
            byte[] publicKeyBytes = hexToBytes(publicKeyHex);
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            // Données signées
            String donnees = transaction.getExpediteur()
                    + transaction.getDestinataire()
                    + String.format("%.9f", transaction.getQuantite());

            // Vérifier la signature
            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initVerify(publicKey);
            signature.update(donnees.getBytes(StandardCharsets.UTF_8));

            return signature.verify(hexToBytes(signatureHex));

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la vérification: " + e.getMessage(), e);
        }
    }

    /**
     * Signer un message libre avec la clé privée d'un wallet
     */
    public String signerMessage(String address, String message) {
        Wallet wallet = wallets.get(address);
        if (wallet == null) {
            throw new RuntimeException("Wallet introuvable pour l'adresse: " + address);
        }
        try {
            byte[] privateKeyBytes = hexToBytes(wallet.getPrivateKey());
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(privateKey);
            signature.update(message.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signature.sign();

            return bytesToHex(signatureBytes);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la signature du message: " + e.getMessage(), e);
        }
    }

    /**
     * Vérifier la signature d'un message libre
     */
    public boolean verifierMessage(String publicKeyHex, String message, String signatureHex) {
        try {
            byte[] publicKeyBytes = hexToBytes(publicKeyHex);
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initVerify(publicKey);
            signature.update(message.getBytes(StandardCharsets.UTF_8));

            return signature.verify(hexToBytes(signatureHex));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Envoyer des fonds d'un wallet à une adresse.
     * La transaction est ajoutée au MEMPOOL (pas confirmée directement).
     * Elle sera confirmée lors du prochain minage.
     */
    public Transaction envoyerFonds(String fromAddress, String toAddress, Double montant, Double fees) {
        Wallet wallet = wallets.get(fromAddress);
        if (wallet == null) {
            throw new RuntimeException("Wallet expéditeur introuvable: " + fromAddress);
        }

        // ── Validation : transaction mal formée ──
        if (toAddress == null || toAddress.isBlank()) {
            throw new RuntimeException("Adresse destinataire invalide ou manquante.");
        }
        if (fromAddress.equals(toAddress)) {
            throw new RuntimeException("L'expéditeur et le destinataire ne peuvent pas être identiques.");
        }
        if (montant == null || montant <= 0) {
            throw new RuntimeException("Le montant doit être strictement positif (reçu : " + montant + ").");
        }
        if (fees == null || fees < 0) {
            throw new RuntimeException("Les frais ne peuvent pas être négatifs.");
        }

        Double balance = calculerBalance(fromAddress);
        double totalNeeded = montant + (fees != null ? fees : 0.0);
        if (balance < totalNeeded) {
            throw new RuntimeException("Solde insuffisant. Solde actuel: " + String.format("%.4f", balance)
                    + " BTC, nécessaire: " + String.format("%.4f", totalNeeded) + " BTC");
        }

        // Créer la transaction avec fees
        Transaction transaction = new Transaction(fromAddress, toAddress, montant, fees != null ? fees : 0.0);

        // Signer la transaction
        signerTransaction(fromAddress, transaction);

        // Ajouter au mempool (sera confirmée au prochain minage)
        blocService.ajouterAuMempool(transaction);

        return transaction;
    }

    // ==================== UTILITAIRES ====================

    /**
     * Générer une adresse à partir de la clé publique (SHA-256 tronqué)
     */
    private String genererAdresse(String publicKeyHex) {
        String hash = blocService.hasher(publicKeyHex);
        // Prendre les 40 premiers caractères (comme une adresse Bitcoin simplifiée)
        return hash.substring(0, 40);
    }

    /**
     * Convertir un tableau de bytes en chaîne hexadécimale
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Convertir une chaîne hexadécimale en tableau de bytes
     */
    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
