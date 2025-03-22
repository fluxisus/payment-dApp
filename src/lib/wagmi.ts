import { createConfig, http } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import {
  metaMask,
  walletConnect,
  injected,
  coinbaseWallet,
} from "wagmi/connectors";

// Wallet Connect Project ID
const walletConnectProjectId = "cf0fac857aec7620f15bea51034ba021";

// Create a custom BSC chain with multiple RPC endpoints for better reliability
const customBsc = {
  ...bsc,
  name: "BSC",
  rpcUrls: {
    default: {
      http: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc-dataseed3.binance.org",
        "https://bsc-dataseed4.binance.org",
      ],
    },
    public: {
      http: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc-dataseed3.binance.org",
        "https://bsc-dataseed4.binance.org",
      ],
    },
  },
};

export function getWagmiConfig() {
  return createConfig({
    chains: [customBsc, mainnet, polygon],
    transports: {
      [customBsc.id]: http(),
      [mainnet.id]: http(),
      [polygon.id]: http(),
    },
    connectors: [
      metaMask(),
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
      }),
      injected(),
      coinbaseWallet({
        appName: "Fluxis dApp",
      }),
    ],
  });
}
