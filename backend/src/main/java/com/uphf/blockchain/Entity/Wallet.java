package com.uphf.blockchain.Entity;

public class Wallet {
    private String privateKey; // Clé privée en hex 
    private String publicKey; // Clé publique en hex
    private String address; // Adresse dérivée du hash de la clé publique
    private String label; // Nom du wallet

    public Wallet() {
    }

    public Wallet(String privateKey, String publicKey, String address, String label) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.address = address;
        this.label = label;
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
}
