package com.uphf.blockchain.Controller;

import com.uphf.blockchain.Entity.*;
import com.uphf.blockchain.Service.BlocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/bloc")
@CrossOrigin(origins = "*")

public class BlocController {
    @Autowired
    private BlocService blocService;

    @GetMapping("/generer")
    public Bloc genererBloc() {
        Bloc bloc = blocService.genererBlocTest();
        return bloc;
    }

    /**
     * POST /api/bloc/miner — Miner un bloc avec les transactions du mempool
     * Body optionnel : { "minerAddress": "adresse_du_wallet_mineur" }
     */
    @PostMapping("/miner")
    public ResponseEntity<?> minerBloc(@RequestBody(required = false) Map<String, Object> body) {
        try {
            String minerAddress = null;
            int target = 3;
            if (body != null) {
                if (body.containsKey("minerAddress") && body.get("minerAddress") != null) {
                    minerAddress = body.get("minerAddress").toString();
                }
                if (body.containsKey("target") && body.get("target") != null) {
                    if (body.get("target") instanceof Number) {
                        target = ((Number) body.get("target")).intValue();
                    } else {
                        target = Integer.parseInt(body.get("target").toString());
                    }
                } else if (body.containsKey("difficulty") && body.get("difficulty") != null) {
                    if (body.get("difficulty") instanceof Number) {
                        target = ((Number) body.get("difficulty")).intValue();
                    } else {
                        target = Integer.parseInt(body.get("difficulty").toString());
                    }
                }
            }
            Bloc bloc = blocService.minerBloc(minerAddress, target);
            return ResponseEntity.ok(Map.of(
                    "message", "Bloc miné avec succès !",
                    "bloc", bloc,
                    "reward", 6.25,
                    "minerAddress", minerAddress != null ? minerAddress : "N/A"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/bloc/miner — Minage rapide sans wallet (compatibilité)
     */
    @GetMapping("/miner")
    public Bloc minerBlocGet() {
        return blocService.minerBloc(null, 3);
    }

    // ==================== MEMPOOL ====================

    /**
     * GET /api/bloc/mempool — Contenu du mempool
     */
    @GetMapping("/mempool")
    public ResponseEntity<List<Transaction>> getMempool() {
        return ResponseEntity.ok(blocService.getMempool());
    }

    /**
     * DELETE /api/bloc/mempool/{index} — Supprimer une transaction du mempool
     */
    @DeleteMapping("/mempool/{index}")
    public ResponseEntity<?> supprimerDuMempool(@PathVariable int index) {
        try {
            Transaction removed = blocService.supprimerDuMempool(index);
            return ResponseEntity.ok(Map.of(
                    "message", "Transaction supprimée du mempool",
                    "transaction", removed));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/bloc/mempool — Vider tout le mempool
     */
    @DeleteMapping("/mempool")
    public ResponseEntity<?> viderMempool() {
        blocService.viderMempool();
        return ResponseEntity.ok(Map.of("message", "Mempool vidé"));
    }

    // ==================== BLOCKCHAIN ====================

    /**
     * GET /api/bloc/blockchain — Retourne toute la blockchain
     */
    @GetMapping("/blockchain")
    public ResponseEntity<List<Bloc>> getBlockchain() {
        return ResponseEntity.ok(blocService.getBlockchain());
    }

    /**
     * DELETE /api/bloc/blockchain — Vider totalement la blockchain (reset)
     */
    @DeleteMapping("/blockchain")
    public ResponseEntity<?> resetBlockchain() {
        blocService.resetBlockchain();
        return ResponseEntity.ok(Map.of("message", "Blockchain réinitialisée avec succès"));
    }

    /**
     * POST /api/bloc/blockchain/save — Sauvegarde la blockchain localement
     */
    @PostMapping("/blockchain/save")
    public ResponseEntity<?> saveBlockchain() {
        try {
            blocService.sauvegarderBlockchain();
            return ResponseEntity.ok(Map.of("message", "Blockchain et Mempool sauvegardés avec succès."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/bloc/blockchain/load — Charge la blockchain depuis la sauvegarde locale
     */
    @PostMapping("/blockchain/load")
    public ResponseEntity<?> loadBlockchain() {
        try {
            blocService.chargerBlockchain();
            return ResponseEntity.ok(Map.of("message", "Blockchain chargée avec succès."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/3")
    public void afficher3() {
        blocService.test3();
    }

}
