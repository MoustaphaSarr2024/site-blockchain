package com.uphf.blockchain.Entity;

public class User {
    private String email;
    private String password;

    private String walletAddress;

    // Constructeur simplifié : Juste email et mot de passe
    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getters
    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }
}