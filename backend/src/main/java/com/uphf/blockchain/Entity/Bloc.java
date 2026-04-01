package com.uphf.blockchain.Entity;

public class Bloc {
    Header BlockHeader;
    Body BlockBody;
    private String hash;
    private int index;

    public Bloc(Header blockHeader, Body blockBody) {
        BlockHeader = blockHeader;
        BlockBody = blockBody;
    }

    public Bloc() {

    }

    public Body getBlockBody() {
        return BlockBody;
    }

    public void setBlockBody(Body blockBody) {
        BlockBody = blockBody;
    }

    public Header getBlockHeader() {
        return BlockHeader;
    }

    public void setBlockHeader(Header blockHeader) {
        BlockHeader = blockHeader;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }
}
