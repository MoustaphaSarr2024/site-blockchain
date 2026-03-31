package com.uphf.blockchain.Entity;

/**
 * TxOutput — Sortie d'une transaction.
 * Représente où vont les fonds (destinataire et/ou monnaie rendue à l'expéditeur).
 */
public class TxOutput {

    private int    index;       // 0 = destinataire principal, 1 = change (monnaie rendue)
    private double value;       // Montant de cette sortie
    private String address;     // Adresse du propriétaire de cette sortie (scriptPubKey simplifié)
    private String type;        // "PAYMENT" | "CHANGE"

    public TxOutput() {}

    public TxOutput(int index, double value, String address, String type) {
        this.index   = index;
        this.value   = value;
        this.address = address;
        this.type    = type;
    }

    public int  getIndex()              { return index; }
    public void setIndex(int index)     { this.index = index; }

    public double getValue()              { return value; }
    public void   setValue(double value)  { this.value = value; }

    public String getAddress()                { return address; }
    public void   setAddress(String address)  { this.address = address; }

    public String getType()               { return type; }
    public void   setType(String type)    { this.type = type; }
}
