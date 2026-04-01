package com.uphf.blockchain.Entity;

public class MerkleProof {
    public int[] IndexMapping;
    public String[] MerkleTree;


    public MerkleProof(int indexSize, int treeSize) {
        IndexMapping = new  int[indexSize];
        MerkleTree =  new String [treeSize];
    }
    public MerkleProof(){

    }



}
