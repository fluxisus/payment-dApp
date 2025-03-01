import { createConfig, http } from "wagmi";
import { mainnet, sepolia, polygon, bsc } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, sepolia, polygon, bsc],
    connectors: [
      metaMask({
        shimDisconnect: true,
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [polygon.id]: http(),
      [bsc.id]: http(),
    },
  });
}
