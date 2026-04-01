package com.uphf.blockchain.Entity;

/**
 * TxInput — Entrée d'une transaction.
 * Référence une sortie précédente (previousTxId:outputIndex).
 */
public class TxInput {

    private String previousTxId;   // txId de la transaction précédente
    private int    outputIndex;    // index de la sortie référencée
    private String scriptSig;      // Script de déverrouillage (= signature ECDSA simplifiée)
    private double value;          // Montant de l'entrée (pour affichage)

    public TxInput() {}

    public TxInput(String previousTxId, int outputIndex, String scriptSig, double value) {
        this.previousTxId = previousTxId;
        this.outputIndex  = outputIndex;
        this.scriptSig    = scriptSig;
        this.value        = value;
    }

    public String getPreviousTxId()                    { return previousTxId; }
    public void   setPreviousTxId(String previousTxId) { this.previousTxId = previousTxId; }

    public int  getOutputIndex()                 { return outputIndex; }
    public void setOutputIndex(int outputIndex)  { this.outputIndex = outputIndex; }

    public String getScriptSig()                 { return scriptSig; }
    public void   setScriptSig(String scriptSig) { this.scriptSig = scriptSig; }

    public double getValue()              { return value; }
    public void   setValue(double value)  { this.value = value; }
}
