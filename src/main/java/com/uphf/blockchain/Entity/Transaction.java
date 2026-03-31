package com.uphf.blockchain.Entity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Transaction {

    // ── Champs originaux ───────────────────────────────────────────────────
    String Expediteur;
    String Destinataire;
    Double Quantite;
    Double Fees;
    String Signature;

    // ── Nouveaux champs (structure réelle Bitcoin) ─────────────────────────
    private String       txid;      // Identifiant unique SHA-256 de la transaction
    private String       timestamp; // ISO-8601 (ex: 2025-03-31T20:30:00Z)
    private int          version;   // Version du format (1 = standard)
    private List<TxInput>  inputs;  // Entrées (références aux sorties précédentes)
    private List<TxOutput> outputs; // Sorties (destinataire + change éventuel)

    // ── Constructeurs ──────────────────────────────────────────────────────

    public Transaction() {
        this.version  = 1;
        this.inputs   = new ArrayList<>();
        this.outputs  = new ArrayList<>();
        this.timestamp = Instant.now().toString();
    }

    public Transaction(String expediteur, String destinataire, Double quantite) {
        this();
        Expediteur   = expediteur;
        Destinataire = destinataire;
        Quantite     = quantite;
        Fees         = 0.0;
    }

    public Transaction(String expediteur, String destinataire, Double quantite, Double fees) {
        this();
        Expediteur   = expediteur;
        Destinataire = destinataire;
        Quantite     = quantite;
        Fees         = fees;
    }

    // ── Méthode utilitaire : générer le txid ───────────────────────────────

    public void generateTxid() {
        String raw = (Expediteur   != null ? Expediteur   : "") +
                     (Destinataire != null ? Destinataire : "") +
                     (Quantite     != null ? Quantite     : 0.0) +
                     (Fees         != null ? Fees         : 0.0) +
                     (timestamp    != null ? timestamp    : "");
        try {
            MessageDigest md   = MessageDigest.getInstance("SHA-256");
            byte[]        hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex  = new StringBuilder(64);
            for (byte b : hash) hex.append(String.format("%02x", b));
            this.txid = hex.toString();
        } catch (Exception ignored) {
            this.txid = Integer.toHexString(raw.hashCode());
        }
    }

    // ── Getters & Setters (champs originaux) ──────────────────────────────

    public Double getQuantite()                     { return Quantite; }
    public void   setQuantite(Double q)             { Quantite = q; }

    public String getDestinataire()                 { return Destinataire; }
    public void   setDestinataire(String d)         { Destinataire = d; }

    public String getExpediteur()                   { return Expediteur; }
    public void   setExpediteur(String e)           { Expediteur = e; }

    public String getSignature()                    { return Signature; }
    public void   setSignature(String signature)    { Signature = signature; }

    public Double getFees()                         { return Fees; }
    public void   setFees(Double fees)              { Fees = fees; }

    // ── Getters & Setters (nouveaux champs) ───────────────────────────────

    public String getTxid()                         { return txid; }
    public void   setTxid(String txid)              { this.txid = txid; }

    public String getTimestamp()                    { return timestamp; }
    public void   setTimestamp(String timestamp)    { this.timestamp = timestamp; }

    public int  getVersion()                        { return version; }
    public void setVersion(int version)             { this.version = version; }

    public List<TxInput>  getInputs()               { return inputs; }
    public void setInputs(List<TxInput> inputs)     { this.inputs = inputs; }

    public List<TxOutput> getOutputs()              { return outputs; }
    public void setOutputs(List<TxOutput> outputs)  { this.outputs = outputs; }
}
