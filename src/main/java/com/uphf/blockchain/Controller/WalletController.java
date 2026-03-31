package com.uphf.blockchain.Controller;

import com.uphf.blockchain.Entity.Transaction;
import com.uphf.blockchain.Entity.WalletDTO;
import com.uphf.blockchain.Service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/wallet")
@CrossOrigin(origins = "*")
public class WalletController {

    @Autowired
    private WalletService walletService;

    /**
     * POST /api/wallet — Créer un nouveau wallet
     */
    @PostMapping
    public ResponseEntity<?> creerWallet(@RequestBody Map<String, String> body) {
        try {
            String label = body.getOrDefault("label", "Wallet");
            WalletDTO wallet = walletService.creerWallet(label);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/wallet — Lister tous les wallets
     */
    @GetMapping
    public ResponseEntity<List<WalletDTO>> getAllWallets() {
        return ResponseEntity.ok(walletService.getAllWallets());
    }

    /**
     * GET /api/wallet/{address} — Détails d'un wallet avec solde
     */
    @GetMapping("/{address}")
    public ResponseEntity<?> getWallet(@PathVariable String address) {
        try {
            WalletDTO wallet = walletService.getWallet(address);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/wallet/{address}/balance — Solde d'un wallet
     */
    @GetMapping("/{address}/balance")
    public ResponseEntity<?> getBalance(@PathVariable String address) {
        try {
            Double balance = walletService.calculerBalance(address);
            return ResponseEntity.ok(Map.of("address", address, "balance", balance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/{address}/faucet — Créditer un wallet avec des BTC de test
     */
    @PostMapping("/{address}/faucet")
    public ResponseEntity<?> faucet(
            @PathVariable String address,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Double montant = 1.0; // Défaut : 1 BTC
            if (body != null && body.containsKey("montant")) {
                montant = Double.parseDouble(body.get("montant").toString());
            }
            WalletDTO wallet = walletService.faucet(address, montant);
            return ResponseEntity.ok(Map.of(
                    "message", "Faucet: " + montant + " BTC crédités",
                    "wallet", wallet));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/{address}/sign — Signer une transaction
     */
    @PostMapping("/{address}/sign")
    public ResponseEntity<?> signerTransaction(
            @PathVariable String address,
            @RequestBody Map<String, Object> body) {
        try {
            String destinataire = (String) body.get("destinataire");
            Double quantite = Double.parseDouble(body.get("quantite").toString());

            Transaction transaction = new Transaction(address, destinataire, quantite);
            String signature = walletService.signerTransaction(address, transaction);

            return ResponseEntity.ok(Map.of(
                    "transaction", transaction,
                    "signature", signature));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/verify — Vérifier une signature
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifierSignature(@RequestBody Map<String, Object> body) {
        try {
            String publicKey = (String) body.get("publicKey");
            String expediteur = (String) body.get("expediteur");
            String destinataire = (String) body.get("destinataire");
            Double quantite = Double.parseDouble(body.get("quantite").toString());
            String signature = (String) body.get("signature");

            Transaction transaction = new Transaction(expediteur, destinataire, quantite);
            boolean valide = walletService.verifierSignature(publicKey, transaction, signature);

            return ResponseEntity.ok(Map.of("valide", valide));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/{address}/send — Envoyer des fonds (ajouté au mempool)
     */
    @PostMapping("/{address}/send")
    public ResponseEntity<?> envoyerFonds(
            @PathVariable String address,
            @RequestBody Map<String, Object> body) {
        try {
            String destinataire = (String) body.get("destinataire");
            Double montant = Double.parseDouble(body.get("montant").toString());
            Double fees = 0.0;
            if (body.containsKey("fees")) {
                fees = Double.parseDouble(body.get("fees").toString());
            }

            Transaction transaction = walletService.envoyerFonds(address, destinataire, montant, fees);
            return ResponseEntity.ok(Map.of(
                    "message", "Transaction ajoutée au mempool (en attente de minage)",
                    "transaction", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/{address}/signMessage — Signer un message libre
     */
    @PostMapping("/{address}/signMessage")
    public ResponseEntity<?> signerMessage(
            @PathVariable String address,
            @RequestBody Map<String, String> body) {
        try {
            String message = body.get("message");
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide"));
            }
            String signature = walletService.signerMessage(address, message);
            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "address", address,
                    "signature", signature));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/wallet/verifyMessage — Vérifier la signature d'un message libre
     */
    @PostMapping("/verifyMessage")
    public ResponseEntity<?> verifierMessage(@RequestBody Map<String, String> body) {
        try {
            String publicKey = body.get("publicKey");
            String message   = body.get("message");
            String signature = body.get("signature");
            if (publicKey == null || message == null || signature == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Champs manquants : publicKey, message, signature"));
            }
            boolean valide = walletService.verifierMessage(publicKey, message, signature);
            return ResponseEntity.ok(Map.of("valide", valide, "message", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
