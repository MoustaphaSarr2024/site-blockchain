package com.uphf.blockchain.Service;

import com.uphf.blockchain.Entity.*;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class BlocService {

    // ==================== MEMPOOL ====================
    private final List<Transaction> mempool = new ArrayList<>();

    // Blockchain : liste des blocs minés
    private final List<Bloc> blockchain = new ArrayList<>();

    // Récompense fixe par bloc (comme Bitcoin)
    private static final Double BLOCK_REWARD = 6.25;

    /**
     * Ajouter une transaction au mempool
     */
    public void ajouterAuMempool(Transaction tx) {
        mempool.add(tx);
    }

    /**
     * Retourner le contenu du mempool
     */
    public List<Transaction> getMempool() {
        return new ArrayList<>(mempool);
    }

    /**
     * Supprimer une transaction du mempool par index
     */
    public Transaction supprimerDuMempool(int index) {
        if (index < 0 || index >= mempool.size()) {
            throw new RuntimeException("Index invalide: " + index + " (mempool size: " + mempool.size() + ")");
        }
        return mempool.remove(index);
    }

    /**
     * Vider tout le mempool
     */
    public void viderMempool() {
        mempool.clear();
    }

    // ==================== GÉNÉRATION TEST ====================

    public Bloc genererBlocTest() {
        Header headertest = genererHeaderTest();
        Body bodyTest = genererBodyTest();
        Bloc bloc = new Bloc(headertest, bodyTest);
        bloc.setHash(hasherHeader(headertest));
        bloc.setIndex(blockchain.size());
        return bloc;
    }

    public String genererRandomString() {
        String charPool = "0123456789abcdefghijklmnopqrstuvwxyz";
        Random randomNumbers = new Random();
        char[] ransString = new char[10];
        for (int i = 0; i < 10; i++) {
            ransString[i] = charPool.charAt(randomNumbers.nextInt(charPool.length()));
        }
        String result = new String(ransString);
        return hasher(result);
    }

    public Header genererHeaderTest() {
        Random randNumber = new Random();
        Header header = new Header(
                genererRandomString(),
                LocalDate.now(),
                genererRandomString(),
                3,
                randNumber.nextInt(1000));
        return header;
    }

    public Transaction genererTransactionTest() {
        Random randNumber = new Random();
        Transaction transaction = new Transaction(
                genererRandomString(),
                genererRandomString(),
                randNumber.nextDouble() * 100);
        transaction.setFees(Math.round(randNumber.nextDouble() * 0.01 * 10000.0) / 10000.0);
        return transaction;
    }

    public CoinBase genererCoinbaseTest() {
        Random randNumber = new Random();
        CoinBase coinbase = new CoinBase(randNumber.nextDouble() * 100, 0);
        return coinbase;
    }

    public Body genererBodyTest() {
        List<Transaction> transList = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            transList.add(genererTransactionTest());
        }
        Body body = new Body(genererCoinbaseTest(), transList);
        return body;
    }

    // ==================== MINAGE RÉEL ====================

    /**
     * Miner un bloc avec les transactions du mempool.
     * Le mineur reçoit la récompense de bloc + la somme des fees.
     * 
     * @param minerAddress adresse du wallet mineur (peut être null pour minage
     *                     test)
     * @return le bloc miné
     */
    public Bloc minerBloc(String minerAddress) {
        List<Transaction> transactionsAMiner;
        boolean fromMempool = !mempool.isEmpty();

        if (fromMempool) {
            // Prendre les transactions du mempool (max 10 par bloc)
            int count = Math.min(mempool.size(), 10);
            transactionsAMiner = new ArrayList<>(mempool.subList(0, count));
        } else {
            // Si mempool vide, générer des transactions test
            transactionsAMiner = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                transactionsAMiner.add(genererTransactionTest());
            }
        }

        // Calculer la somme des fees
        double totalFees = 0.0;
        for (Transaction tx : transactionsAMiner) {
            if (tx.getFees() != null) {
                totalFees += tx.getFees();
            }
        }

        // Créer la coinbase (récompense + fees)
        double recompenseTotal = BLOCK_REWARD + totalFees;
        CoinBase coinbase;
        if (minerAddress != null && !minerAddress.isEmpty()) {
            coinbase = new CoinBase(recompenseTotal, 0, minerAddress);
        } else {
            coinbase = new CoinBase(recompenseTotal, 0);
        }

        // Construire le body
        Body body = new Body(coinbase, transactionsAMiner);

        // Construire le header
        String previousHash = blockchain.isEmpty() ? "0000000000000000000000000000000000000000000000000000000000000000"
                : hasherHeader(blockchain.get(blockchain.size() - 1).getBlockHeader());

        String merkleRoot = trouverMerkle(transactionsAMiner, 0, transactionsAMiner.size() - 1);

        Header header = new Header(previousHash, LocalDate.now(), merkleRoot, 3, 0);

        // Assembler le bloc
        Bloc bloc = new Bloc(header, body);

        // Proof of Work
        consensus(bloc);

        // Retirer les transactions minées du mempool
        if (fromMempool) {
            int count = Math.min(mempool.size(), 10);
            for (int i = 0; i < count; i++) {
                mempool.remove(0);
            }
        }

        // Ajouter le hash et l'index avant la sauvegarde
        bloc.setHash(hasherHeader(bloc.getBlockHeader()));
        bloc.setIndex(blockchain.size());

        // Ajouter le bloc à la blockchain
        blockchain.add(bloc);

        return bloc;
    }

    /**
     * Retourne les transactions confirmées (de tous les blocs minés)
     */
    public List<Transaction> getTransactionsConfirmees() {
        List<Transaction> confirmed = new ArrayList<>();
        for (Bloc bloc : blockchain) {
            confirmed.addAll(bloc.getBlockBody().getTransactionList());
            // Ajouter la coinbase comme une transaction vers le mineur
            CoinBase cb = bloc.getBlockBody().getCoinBaseTrans();
            if (cb.getMinerAddress() != null) {
                Transaction coinbaseTx = new Transaction("COINBASE", cb.getMinerAddress(), cb.getRecompense());
                confirmed.add(coinbaseTx);
            }
        }
        return confirmed;
    }

    /**
     * Retourne la blockchain complète
     */
    public List<Bloc> getBlockchain() {
        return new ArrayList<>(blockchain);
    }

    /**
     * Vider la blockchain (reset)
     */
    public void resetBlockchain() {
        blockchain.clear();
        mempool.clear(); // Reset mempool as well for a clean state
    }

    // ==================== AFFICHAGE ====================

    public void afficherHeader(Header header) {
        System.out.println(" HEADER:");
        System.out.println("  Hash Precedent:" + header.getHashPre());
        System.out.println("  Merkle Root:" + header.getMerkleRoot());
        System.out.println("  TimeStamp:" + header.getTimeStamp().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        System.out.println("  Target (Complexite):" + header.getTarget());
        System.out.println("  Nonce:" + String.valueOf(header.getNonce()));
    }

    public void afficherCoinbase(CoinBase coinBase) {
        System.out.println("  COINBASE:");
        System.out.println("   Recompense:" + String.format("%.9f", coinBase.getRecompense()));
        System.out.println("   ExtraNonce:" + String.valueOf(coinBase.getExtraNonce()));
        if (coinBase.getMinerAddress() != null) {
            System.out.println("   MinerAddress:" + coinBase.getMinerAddress());
        }
    }

    public void afficherTransaction(Transaction transaction) {
        System.out.println("    Expediteur:" + transaction.getExpediteur());
        System.out.println("    Destinataire:" + transaction.getDestinataire());
        System.out.println("    Quantite:" + String.format("%.9f", transaction.getQuantite()));
        if (transaction.getFees() != null && transaction.getFees() > 0) {
            System.out.println("    Fees:" + String.format("%.9f", transaction.getFees()));
        }
    }

    public void afficherBody(Body body) {
        System.out.println(" BODY:");
        afficherCoinbase(body.getCoinBaseTrans());
        List<Transaction> transList = body.getTransactionList();
        System.out.println("  TRANSACTIONS:");
        for (int i = 0; i < transList.size(); i++) {
            System.out.println("   Transaction " + String.valueOf(i));
            afficherTransaction(transList.get(i));
        }
    }

    public void afficherBlock(Bloc bloc) {
        System.out.println("AFFICHAGE DE BLOC");
        afficherHeader(bloc.getBlockHeader());
        afficherBody(bloc.getBlockBody());
    }

    // ==================== HASHING ====================

    public String hasher(String mot) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodehash = digest.digest(mot.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodehash.length);
            for (int i = 0; i < encodehash.length; i++) {
                String hex = Integer.toHexString(0xff & encodehash[i]);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur de hachage ", e);
        }
    }

    public String hasherTransaction(Transaction transaction) {
        String result = transaction.getExpediteur() + transaction.getDestinataire();
        result += String.format("%.9f", transaction.getQuantite());
        return hasher(result);
    }

    public String trouverMerkle(List<Transaction> transList, int start, int end) {
        if (start == end) {
            return hasherTransaction(transList.get(start));
        }
        String result = trouverMerkle(transList, start, (start + end) / 2);
        result += trouverMerkle(transList, (start + end) / 2 + 1, end);
        return hasher(result);
    }

    public String hasherCoinBase(CoinBase coinBase) {
        String result = String.format("%.9f", coinBase.getRecompense());
        result += String.valueOf(coinBase.getExtraNonce());
        return hasher(result);
    }

    public String hasherBody(Body body) {
        String result = hasherCoinBase(body.getCoinBaseTrans());
        List<Transaction> transList = body.getTransactionList();
        result += trouverMerkle(transList, 0, transList.size() - 1);
        return hasher(result);
    }

    public void test() {
        Body bodyTest = genererBodyTest();
        String merkleroot = hasherBody(bodyTest);
        System.out.println("Merkle root trouvée:" + merkleroot);
    }

    // ==================== VALIDATION ====================

    public boolean validation(int position) {
        List<Bloc> blocList = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            Bloc bloc1 = blocList.get(position - i);
            Bloc bloc2 = blocList.get(position - i - 1);
            Header header1 = bloc1.getBlockHeader();
            Header header2 = bloc2.getBlockHeader();
            if (header1.getHashPre() != hasherHeader(header2)) {
                return false;
            }
            if (!validateTransactions(bloc1.getBlockBody(), header1.getMerkleRoot())) {
                return false;
            }
        }
        return true;
    }

    public String hasherHeader(Header header) {
        String result = header.getHashPre() + String.valueOf(header.getNonce());
        result = hasher(result);
        result += header.getTimeStamp().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        result += header.getMerkleRoot();
        result = hasher(result);
        result += header.getTarget();
        return hasher(result);
    }

    // ==================== CONSENSUS ====================

    public boolean consensus(Bloc bloc) {
        Header header = bloc.getBlockHeader();
        for (int i = 0; i < Integer.MAX_VALUE; i++) {
            header.setNonce(i);
            String hash = hasherHeader(header);
            if (validerHash(hash, header.getTarget())) {
                return true;
            }
        }
        Body body = bloc.getBlockBody();

        CoinBase coinBase = body.getCoinBaseTrans();
        int extraNonce = coinBase.getExtraNonce();
        coinBase.setExtraNonce(extraNonce + 1);
        body.setCoinBaseTrans(coinBase);
        bloc.setBlockBody(body);
        String merkleroot = hasherBody(body);
        header.setMerkleRoot(merkleroot);
        bloc.setBlockHeader(header);

        return consensus(bloc);
    }

    public boolean validerHash(String hash, int target) {
        int position = 0;
        while (target > 0) {
            if (hash.charAt(position) != '0') {
                return false;
            }
            target--;
            position++;
        }
        return true;
    }

    // ==================== MERKLE PROOF ====================

    public boolean validateTransactions(Body body, String merkleRoot) {
        List<Transaction> transList = body.getTransactionList();
        String hashCoinBase = hasherCoinBase(body.getCoinBaseTrans());

        int upperBound = 1;
        while (upperBound < transList.size()) {
            upperBound *= 2;
        }
        upperBound = upperBound * 2 - 1;
        MerkleProof merkleProof = fillMerkleProof(
                0,
                transList.size(),
                0,
                new MerkleProof(
                        transList.size(),
                        upperBound),
                transList);
        for (int i = 0; i < transList.size(); i++) {
            int actuelle = merkleProof.IndexMapping[i];
            String hash = "";
            while (actuelle > 0) {
                hash = merkleProof.MerkleTree[actuelle];
                if (actuelle % 2 == 0) {
                    hash += merkleProof.MerkleTree[actuelle - 1];
                } else {
                    hash += merkleProof.MerkleTree[actuelle + 1];
                }
                hash = hasher(hash);
                actuelle = (actuelle - 1) / 2;
                if (hash != merkleProof.MerkleTree[actuelle]) {
                    return false;
                }
            }
            hash = merkleProof.MerkleTree[actuelle] + hashCoinBase;
            if (hasher(hash) != merkleRoot) {
                return false;
            }

        }
        return true;
    }

    MerkleProof fillMerkleProof(int start, int end, int index, MerkleProof merkleProof,
            List<Transaction> transList) {
        if (start == end) {
            merkleProof.IndexMapping[start] = index;
            merkleProof.MerkleTree[index] = hasherTransaction(transList.get(start));
            return merkleProof;
        }
        merkleProof = fillMerkleProof(start, (start + end) / 2, index * 2 + 1, merkleProof, transList);
        merkleProof = fillMerkleProof((start + end) / 2 + 1, end, index * 2 + 2, merkleProof, transList);
        merkleProof.MerkleTree[index] = merkleProof.MerkleTree[index * 2 + 1]
                + merkleProof.MerkleTree[index * 2 + 2];
        merkleProof.MerkleTree[index] = hasher(merkleProof.MerkleTree[index]);
        return merkleProof;
    }

    public void test2() {
        Bloc bloc = genererBlocTest();
        Header header = bloc.getBlockHeader();
        afficherHeader(header);
        Body bodyTest = bloc.getBlockBody();
        String merkleroot = trouverMerkle(bodyTest.getTransactionList(), 0,
                bodyTest.getTransactionList().size() - 1);
        System.out.println("MerkleRoot " + merkleroot);
        header.setMerkleRoot(merkleroot);
        bloc.setBlockHeader(header);
        afficherBlock(bloc);
        consensus(bloc);
        afficherHeader(bloc.getBlockHeader());
        System.out.println("Hash de bloc = " + hasherHeader(bloc.getBlockHeader()));
    }

    public void test3() {
        Body body = genererBodyTest();
        List<Transaction> testList = body.getTransactionList();
        System.out.println("tSize:" + testList.size());
        int upperBound = 1;
        while (upperBound < testList.size()) {
            upperBound *= 2;
        }
        upperBound = upperBound * 2 - 1;
        System.out.println("Upperbound:" + upperBound);

        MerkleProof merkleProof = fillMerkleProof(
                0,
                testList.size() - 1,
                0,
                new MerkleProof(
                        testList.size(),
                        upperBound),
                testList);
    }
}
