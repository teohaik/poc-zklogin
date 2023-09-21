import { SuiClient } from "@mysten/sui.js/client";
import { ADMIN_ADDRESS, SUI_NETWORK } from "./config";
import { getCoinsOfAddress } from "./examples/getCoinsOfAddress";

console.log("Connecting to SUI network: ", SUI_NETWORK);

const run = async () => {
  const suiClient = new SuiClient({ url: SUI_NETWORK });
  const coins = await getCoinsOfAddress({ client: suiClient, address: ADMIN_ADDRESS });
  console.log(coins);
};

run();
