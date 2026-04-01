package com.uphf.blockchain.Entity;

public class CoinBase {
    Double Recompense;
    int ExtraNonce;
    String MinerAddress; // Adresse du mineur qui recoit la recompense

    public CoinBase(Double recompense, int extraNonce) {
        Recompense = recompense;
        ExtraNonce = extraNonce;
    }
    public CoinBase(){

    }

    public CoinBase(Double recompense, int extraNonce, String minerAddress) {
        Recompense = recompense;
        ExtraNonce = extraNonce;
        MinerAddress = minerAddress;
    }

    public Double getRecompense() {
        return Recompense;
    }

    public void setRecompense(Double recompense) {
        Recompense = recompense;
    }

    public int getExtraNonce() {
        return ExtraNonce;
    }

    public void setExtraNonce(int extraNonce) {
        ExtraNonce = extraNonce;
    }

    public String getMinerAddress() {
        return MinerAddress;
    }

    public void setMinerAddress(String minerAddress) {
        MinerAddress = minerAddress;
    }
}
