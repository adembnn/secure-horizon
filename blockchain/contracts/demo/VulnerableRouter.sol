// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VulnerableRouter
 * @notice Routeur d'échange de démonstration, HONNÊTE au départ, mais porteur d'une
 *         FAILLE VOLONTAIRE. Il se comporte comme beaucoup de services réels : il échange
 *         DemoUSDC <-> DemoWAVAX au taux fixe 1 WAVAX = 100 USDC, et les utilisateurs lui
 *         accordent souvent un droit de dépense ILLIMITÉ (c'est l'usage par défaut de nombreux
 *         sites honnêtes). Rien de malveillant tant que le code n'est pas détourné.
 *
 *         LA FAILLE (`execute`) : une fonction d'appel générique NON PROTÉGÉE. N'importe qui
 *         peut faire exécuter au routeur un appel arbitraire. Un tiers s'en sert pour appeler
 *         `transferFrom(victime, lui-même, montant)` sur le jeton : comme la victime a donné son
 *         droit AU ROUTEUR, le transfert passe. Le jour où le service est compromis, tout ce que
 *         les utilisateurs lui ont laissé le droit de prendre est perdu.
 *
 *         Dans l'esprit de l'incident réel LI.FI (16 juillet 2024) : un appel externe mal protégé
 *         a permis de vider, via `transferFrom`, les seuls portefeuilles ayant accordé un droit
 *         illimité. Les droits limités n'ont rien perdu.
 *
 *         ⚠️  CONTRAT VOLONTAIREMENT VULNÉRABLE — OBJET DE TEST UNIQUEMENT.
 *         ⚠️  NE JAMAIS DÉPLOYER AILLEURS QUE SUR NOTRE CHAÎNE LOCALE / HARDHAT.
 *         ⚠️  Aucune donnée réelle, aucun système réel : il ne sert qu'à produire les données
 *             de démonstration de Hold up sur un environnement que nous possédons.
 */
contract VulnerableRouter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable wavax;

    // Taux fixe : 1 WAVAX (18 déc.) = 100 USDC (6 déc.), comme DemoRouter.
    uint256 public constant RATE_USDC_PER_WAVAX = 100;

    event Swap(address indexed user, uint256 amountIn, uint256 amountOut);
    // Émis quand la faille est exploitée : trace on-chain du « piratage » pour la démo.
    event Exploited(address indexed caller, address indexed target);

    constructor(address _usdc, address _wavax) {
        require(_usdc != address(0) && _wavax != address(0), "Invalid token addresses");
        usdc = IERC20(_usdc);
        wavax = IERC20(_wavax);
    }

    /**
     * @notice Échange honnête : USDC -> WAVAX. Prélève `amountIn` USDC à l'appelant (droit requis)
     *         et lui renvoie le WAVAX. Comportement normal, identique à un routeur légitime.
     */
    function swapUSDCforWAVAX(uint256 amountIn, uint256 minAmountOut)
        external
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount must be > 0");
        amountOut = (amountIn * 1e12) / RATE_USDC_PER_WAVAX;
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(wavax.balanceOf(address(this)) >= amountOut, "Insufficient liquidity");

        usdc.safeTransferFrom(msg.sender, address(this), amountIn);
        wavax.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, amountIn, amountOut);
    }

    /**
     * @notice Alimente le routeur en liquidité (préparation de la démo).
     */
    function addLiquidity(uint256 usdcAmount, uint256 wavaxAmount) external {
        if (usdcAmount > 0) usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        if (wavaxAmount > 0) wavax.safeTransferFrom(msg.sender, address(this), wavaxAmount);
    }

    /**
     * @notice ⚠️ LA FAILLE. Fonction d'appel générique sans aucun contrôle d'accès ni liste blanche.
     *         Pensée pour « agréger » des échanges en appelant d'autres contrats, elle laisse en fait
     *         n'importe qui faire parler le routeur au nom du routeur. Un tiers appelle ici avec
     *         `target = jeton` et `data = transferFrom(victime, pirate, montant)` : le routeur étant
     *         l'appelant, il consomme le droit que la victime lui a donné, et les fonds partent.
     *         C'est exactement ce qu'un attaquant exploite quand un service de ce type est compromis.
     * @param target  Contrat appelé par le routeur (le jeton, dans l'attaque).
     * @param data    Calldata exécutée au nom du routeur (un transferFrom, dans l'attaque).
     */
    function execute(address target, bytes calldata data) external returns (bytes memory) {
        (bool ok, bytes memory ret) = target.call(data);
        require(ok, "call failed");
        emit Exploited(msg.sender, target);
        return ret;
    }
}
