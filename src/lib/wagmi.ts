import { createConfig, http } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

// Create a custom BSC chain with the name "BSC" instead of "BNB Smart Chain"
const customBsc = {
  ...bsc,
  name: "BSC",
};

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, polygon, customBsc],
    connectors: [metaMask()],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [customBsc.id]: http(),
    },
  });
}
