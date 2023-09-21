import { CoinStruct, SuiClient } from "@mysten/sui.js/client";

interface GetMyCoinsProps {
  client: SuiClient;
  address: string;
}

// CAUTION: the way this method is implemented does NOT return all coins, only the first page of coins.
export const getCoinsOfAddress = async ({
  client,
  address,
}: GetMyCoinsProps) => {
  let coins: CoinStruct[] = [];
  await client
    .getAllCoins({
      owner: address
    })
    .then((resp) => {
      coins = resp.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return coins;
};
