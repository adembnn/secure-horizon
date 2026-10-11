// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EvidenceAnchor
 * @notice Ancrage de racines de Merkle d'un journal de verdicts (Sentinelle).
 *         On ne publie QUE une racine (32 octets) + l'intervalle d'entrees couvert
 *         + la version des regles. Aucune donnee personnelle, aucun texte.
 *
 *         Ce que prouve l'evenement : "cette racine existait au plus tard au bloc N
 *         (donc a la date du bloc), publiee par cette adresse". Ce n'est PAS une
 *         preuve que l'alerte etait juste.
 *
 *         Volontairement minimal : pas de proprietaire, pas d'admin, pas de pause,
 *         pas de mise a jour, pas de suppression. N'importe qui peut ancrer ; c'est
 *         l'adresse `sender` (msg.sender) qui identifie l'emetteur, a filtrer cote
 *         verificateur.
 */
contract EvidenceAnchor {
    struct Record {
        bytes32 root;
        uint64 fromIndex;
        uint64 toIndex;
        uint32 ruleVersion;
        uint64 timestamp;
        address sender;
    }

    /// Ordre d'ancrage = ordre du tableau (append-only).
    Record[] private records;

    event Anchored(
        address indexed sender,
        bytes32 indexed root,
        uint64 fromIndex,
        uint64 toIndex,
        uint32 ruleVersion,
        uint256 seq,
        uint64 blockTime
    );

    /// Ancre une racine couvrant les entrees [fromIndex, toIndex] (bornes incluses).
    function anchor(bytes32 root, uint64 fromIndex, uint64 toIndex, uint32 ruleVersion) external {
        require(toIndex >= fromIndex, "intervalle invalide");
        uint256 seq = records.length;
        records.push(Record(root, fromIndex, toIndex, ruleVersion, uint64(block.timestamp), msg.sender));
        emit Anchored(msg.sender, root, fromIndex, toIndex, ruleVersion, seq, uint64(block.timestamp));
    }

    /// Nombre d'ancrages enregistres.
    function count() external view returns (uint256) {
        return records.length;
    }

    /// Lecture d'un ancrage par son rang.
    function get(uint256 seq) external view returns (Record memory) {
        return records[seq];
    }
}
