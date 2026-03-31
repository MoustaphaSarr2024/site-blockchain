package com.uphf.blockchain.Entity;

/**
 * DTO pour exposer un wallet avec la clé privée (usage pédagogique).
 */
public class WalletDTO {
    private String publicKey;
    private String privateKey;
    private String address;
    private String label;
    private Double balance;

    public WalletDTO() {
    }

    public WalletDTO(String publicKey, String privateKey, String address, String label, Double balance) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.address = address;
        this.label = label;
        this.balance = balance;
    }

    /**
     * Crée un WalletDTO à partir d'un Wallet (inclut la clé privée pour usage pédagogique)
     */
    public static WalletDTO fromWallet(Wallet wallet, Double balance) {
        return new WalletDTO(
                wallet.getPublicKey(),
                wallet.getPrivateKey(),
                wallet.getAddress(),
                wallet.getLabel(),
                balance);
    }

    public String getPrivateKey() {
        return privateKey;
    }

    public void setPrivateKey(String privateKey) {
        this.privateKey = privateKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }
}
