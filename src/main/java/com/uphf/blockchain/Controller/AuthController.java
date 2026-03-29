package com.uphf.blockchain.Controller;

import com.uphf.blockchain.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5174")
public class AuthController {

    @Autowired
    private com.uphf.blockchain.Service.WalletService walletService;

    // Liste d'utilisateurs (simulation base de données)
    private List<User> users = new ArrayList<>();

    public AuthController() {
        // On ajoute un utilisateur par défaut pour tester
        users.add(new User("etudiant@insa.fr", "password123"));
    }

    // --- CONNEXION (LOGIN) ---
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> found = users.stream()
                .filter(u -> u.getEmail().equals(creds.get("email")) && u.getPassword().equals(creds.get("password")))
                .findFirst();

        if (found.isPresent()) {
            User user = found.get();

            // Si l'utilisateur n'a pas de wallet (ex: default user), on en crée un
            if (user.getWalletAddress() == null) {
                var wallet = walletService.creerWallet("Wallet de " + user.getEmail());
                user.setWalletAddress(wallet.getAddress());
            }

            response.put("success", true);
            response.put("message", "Connexion réussie !");
            response.put("user", user.getEmail());
            response.put("wallet", user.getWalletAddress()); // Renvoie l'adresse
        } else {
            response.put("success", false);
            response.put("message", "Email ou mot de passe incorrect.");
        }
        return response;
    }

    // --- INSCRIPTION (REGISTER) ---
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        String email = creds.get("email");
        String password = creds.get("password");

        // 1. Vérifier si l'email existe déjà
        boolean exists = users.stream().anyMatch(u -> u.getEmail().equals(email));

        if (exists) {
            response.put("success", false);
            response.put("message", "Cet email est déjà pris !");
            return response;
        }

        // 2. Créer l'utilisateur
        User newUser = new User(email, password);

        // 3. Lui créer un wallet automatiquement
        try {
            var walletDTO = walletService.creerWallet("Wallet de " + email);
            newUser.setWalletAddress(walletDTO.getAddress());
            users.add(newUser);

            response.put("success", true);
            response.put("message", "Compte créé avec wallet : " + walletDTO.getAddress());
            response.put("wallet", walletDTO.getAddress());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Erreur création wallet: " + e.getMessage());
            return response;
        }

        System.out.println("Nouvel inscrit : " + email + " -> " + newUser.getWalletAddress());
        return response;
    }
}