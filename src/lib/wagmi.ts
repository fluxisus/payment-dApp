import { createConfig, http } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import {
  metaMask,
  walletConnect,
  injected,
  coinbaseWallet,
} from "wagmi/connectors";

// Wallet Connect Project ID - Reemplaza esto con tu propio ID de proyecto de WalletConnect
const walletConnectProjectId = "cf0fac857aec7620f15bea51034ba021";

// Create a custom BSC chain with the name "BSC" instead of "BNB Smart Chain"
const customBsc = {
  ...bsc,
  name: "BSC",
};

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, polygon, customBsc],
    connectors: [
      metaMask(),
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
      }),
      // Trust Wallet es compatible con el conector injected
      injected(),
      coinbaseWallet({
        appName: "Fluxis dApp",
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [customBsc.id]: http(),
    },
  });
}
