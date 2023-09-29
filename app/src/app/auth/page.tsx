"use client";

import {useLayoutEffect, useState} from "react";
import jwt_decode from "jwt-decode";
import {LoginResponse, PersistentData, UserKeyData} from "@/app/types/UserInfo";

import {genAddressSeed, generateRandomness, getZkSignature, jwtToAddress, ZkSignatureInputs} from '@mysten/zklogin';
import axios from "axios";
import {toBigIntBE} from "bigint-buffer";
import {fromB64} from "@mysten/bcs";
import {useSui} from "@/app/hooks/useSui";
import {SerializedSignature} from "@mysten/sui.js/src/cryptography";
import {Ed25519Keypair} from "@mysten/sui.js/keypairs/ed25519";
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {Blocks} from 'react-loader-spinner'

export default function Page() {

    const [error, setError] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [txDigest, setTxDigest] = useState<string | null>(null);
    const [jwtEncoded, setJwtEncoded] = useState<string | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [userSalt, setUserSalt] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);
    const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);

    const {suiClient} = useSui();


    async function getSalt(subject: string) {
        const dataRequest: PersistentData = {
            subject: subject
        }
        const response = await axios.post('/api/userinfo/get/salt', dataRequest);
        console.log("getSalt response = ", response);
        if (response?.data.status == 200) {
            const userData: PersistentData = response.data.data as PersistentData;
            console.log("Salt fetched! Salt = ", userData.salt);
            return userData.salt;
        } else {
            console.log("Error Getting SALT");
            return null;
        }
    }

    function storeUserKeyData(encodedJwt: string, subject: string, salt: string,) {
        const userKeyData: UserKeyData = JSON.parse(localStorage.getItem("userKeyData")!);
        const dataToStore: PersistentData = {
            ephemeralPublicKey: userKeyData.ephemeralPublicKey,
            jwt: encodedJwt,
            salt: salt,
            subject: subject
        };
        axios.post('/api/userinfo/store', dataToStore)
            .then((response) => {
                console.log("response = ", response);
            }).catch((error) => {
            console.log("error = ", error);
        });
    }

    function printUsefulInfo(decodedJwt: LoginResponse, userKeyData: UserKeyData) {
        console.log("iat  = " + decodedJwt.iat);
        console.log("iss  = " + decodedJwt.iss);
        console.log("sub = " + decodedJwt.sub);
        console.log("aud = " + decodedJwt.aud);
        console.log("exp = " + decodedJwt.exp);
        console.log("nonce = " + decodedJwt.nonce);
        console.log("ephemeralPublicKey b64 =", userKeyData.ephemeralPublicKey);
    }


    async function executeTransactionWithZKP(partialZkSignature :ZkSignatureInputs, ephemeralKeyPair: Ed25519Keypair, userKeyData: UserKeyData, decodedJwt: LoginResponse) {

        console.log("partialZkSignature = ", partialZkSignature);
        const txb = new TransactionBlock();

        //Just a simple Demo call to create a little NFT weapon :p
        txb.moveCall({
            target: `0xf8294cd69d69d867c5a187a60e7095711ba237fad6718ea371bf4fbafbc5bb4b::teotest::create_weapon`,  //demo package published on testnet
            arguments: [
                txb.pure("Zero Knowledge Proof Axe 9000"),  // weapon name
                txb.pure(66),  // weapon damage
            ],
        });
        txb.setSender(userAddress!);

        const signatureWithBytes = await txb.sign({client: suiClient, signer: ephemeralKeyPair});

        console.log("Got SignatureWithBytes = ", signatureWithBytes);
        console.log("maxEpoch = ", userKeyData.maxEpoch);
        console.log("userSignature = ", signatureWithBytes.signature);

        const addressSeed = genAddressSeed(BigInt(userSalt!), "sub", decodedJwt.sub, decodedJwt.aud);

        const zkSignature: SerializedSignature = getZkSignature({
            inputs: {
                ...partialZkSignature,
                addressSeed: addressSeed.toString(),
            },
            maxEpoch: userKeyData.maxEpoch,
            userSignature: signatureWithBytes.signature,
        });

        suiClient.executeTransactionBlock({
            transactionBlock: signatureWithBytes.bytes,
            signature: zkSignature,
            options: {
                showEffects: true
            }
        }).then((response) => {
            if (response.effects?.status.status) {
                console.log("Transaction executed! Digest = ", response.digest);
                setTxDigest(response.digest);
                setTransactionInProgress(false);
            } else {
                console.log("Transaction failed! reason = ", response.effects?.status)
            }
        }).catch((error) => {
            console.log("Error During Tx Execution. Details: ", error);
        });
    }


    async function getZkProofAndExecuteTx() {
        setTransactionInProgress(true);
        const decodedJwt: LoginResponse = jwt_decode(jwtEncoded!) as LoginResponse;
        const {userKeyData, ephemeralKeyPair} = getEphemeralKeyPair();

        printUsefulInfo(decodedJwt, userKeyData);

        const ephemeralPublicKeyArray: Uint8Array = fromB64(userKeyData.ephemeralPublicKey);

        const zkpPayload =
            {
                jwt: jwtEncoded!,
                extendedEphemeralPublicKey: toBigIntBE(
                    Buffer.from(ephemeralPublicKeyArray),
                ).toString(),
                jwtRandomness: userKeyData.randomness,
                maxEpoch: userKeyData.maxEpoch,
                salt: userSalt,
                keyClaimName: "sub"
            };

        console.log("about to post zkpPayload = ", zkpPayload);
        setPublicKey(zkpPayload.extendedEphemeralPublicKey);

        //Invoking our custom backend to delagate Proof Request to Mysten backend.
        // Delegation was done to avoid CORS errors.
        //TODO: Store proof to avoid fetching it every time.
        const proofResponse = await axios.post('/api/zkp/get', zkpPayload);

        console.log("zkp response = ", proofResponse.data.zkp);

        const partialZkSignature: ZkSignatureInputs = proofResponse.data.zkp as ZkSignatureInputs;

        await executeTransactionWithZKP(partialZkSignature, ephemeralKeyPair, userKeyData, decodedJwt);
    }


    function getEphemeralKeyPair() {
        const userKeyData: UserKeyData = JSON.parse(localStorage.getItem("userKeyData")!);
        let ephemeralKeyPairArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKeyPairArray);
        return {userKeyData, ephemeralKeyPair};
    }

    async function checkIfAddressHasBalance(address: string): Promise<boolean> {
        console.log("Checking whether address " + address + "has balance...");
        const coins = await suiClient.getCoins({
            owner: address,
        });
        //loop over coins
        let totalBalance = 0;
        for (const coin of coins.data) {
            totalBalance += parseInt(coin.balance);
        }
        totalBalance = totalBalance / 1000000000;
        setUserBalance(totalBalance);
        console.log("total balance = ", totalBalance);
        return totalBalance > 0;
    }

    async function giveSomeTestCoins(address: string) {
        console.log("Giving some test coins to address " + address);
        let adminPrivateKeyArray = Uint8Array.from(Array.from(fromB64(process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY!)));
        const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyArray.slice(1));
        const tx = new TransactionBlock();
        const giftCoin = tx.splitCoins(tx.gas, [tx.pure(30000000)]);

        tx.transferObjects([giftCoin], tx.pure(address));

        const res = await suiClient.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            signer: adminKeypair,
            requestType: "WaitForLocalExecution",
            options: {
                showEffects: true,
            },
        });
        const status = res?.effects?.status?.status;
        if (status === "success") {
            console.log("Gift Coin transfer executed! status = ", status);
            checkIfAddressHasBalance(address);
        }
        if (status == "failure") {
            console.log("Gift Coin transfer Failed. Error = ", res?.effects);
        }
    }

    async function loadRequiredData(encodedJwt: string) {
        //Decoding JWT to get useful Info
        const decodedJwt: LoginResponse = jwt_decode(encodedJwt!) as LoginResponse;

        //Getting Salt
        const userSalt = await getSalt(decodedJwt.sub);
        if(!userSalt){
            console.log("Error getting userSalt");
            setError("Error getting userSalt");
            return;
        }
        //Storing UserKeyData
        storeUserKeyData(encodedJwt!, decodedJwt.sub, userSalt!);

        //Generating User Address
        const address = jwtToAddress(encodedJwt!, BigInt(userSalt!));

        setUserAddress(address);
        setUserSalt(userSalt!);

        checkIfAddressHasBalance(address);

        console.log("All required data loaded. ZK Address =", address);
    }

    useLayoutEffect(() => {

        const hash = new URLSearchParams(window.location.hash.slice(1));
        const jwt_token_encoded = hash.get("id_token");

        const userKeyData: UserKeyData = JSON.parse(localStorage.getItem("userKeyData")!);

        if (!jwt_token_encoded) {
            setError("Could not retrieve a valid JWT Token!")
            console.log("Could not retrieve a valid JWT Token!");
            return;
        }

        if (!userKeyData) {
            setError("user Data is null");
            console.log("userKeyData is null");
            return;
        }

        setJwtEncoded(jwt_token_encoded);

        loadRequiredData(jwt_token_encoded);

    }, []);

    return (
        <div id="cb" className="flex flex-col items-center mt-10">
            <h1>Callback page</h1>

            <div id="header" className="pb-5 pt-6">
                <h4>Login with External Provider Completed</h4>
            </div>

            {userAddress ? (
                    <div className="flex flex-col items-center mt-10">
                        <h3>Address Generation Completed!</h3>
                        <div id="contents" className="font-medium pb-6 pt-6">
                            <p>User Address = {userAddress}</p>
                        </div>
                        <div id="contents" className="font-medium pb-6 pt-6">
                            <p>Address Balance = {userBalance.toFixed(3)} SUI</p>
                            {userBalance < 0.04 ? (
                                <div>
                                    <p>You may need some coins!</p>
                                    <button
                                        className="bg-green-500 text-white px-4 py-2 rounded-md"
                                        disabled={!userAddress}
                                        onClick={() => giveSomeTestCoins(userAddress!)}
                                    >
                                        Give me some coins please!
                                    </button>
                                </div>

                            ) : null}
                        </div>
                        {userBalance > 0 ? (
                            <div id="contents" className="font-medium pb-6">
                                <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded-md"
                                    disabled={!userAddress}
                                    onClick={() => getZkProofAndExecuteTx()}
                                >
                                    Get ZKP Proof and Execute Transaction
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) :
                null
            }

            {txDigest ? (
                    <div className="flex flex-col items-center mt-10">
                        <h3>Transaction Completed!</h3>
                        <div id="contents" className="font-medium pb-6 pt-6">
                            <p>TxDigest = {txDigest}</p>
                        </div>
                        <div id="contents" className="font-medium pb-6">
                            <button
                                className="bg-gray-400 text-white px-4 py-2 rounded-md"
                                disabled={!userAddress}
                                onClick={() => window.open(`https://suiexplorer.com/txblock/${txDigest}?network=testnet`, "_blank")}
                            >
                                See it on Sui Explorer
                            </button>
                        </div>
                    </div>
                ) :
                null
            }

            {transactionInProgress ? (
                <div className="flex space-x-4 justify-center">
                    <Blocks
                        visible={true}
                        height="80"
                        width="80"
                        ariaLabel="blocks-loading"
                        wrapperStyle={{}}
                        wrapperClass="blocks-wrapper"
                    />
                </div>

            ): null}

            {error ? (
                <div id="header" className="pb-5 pt-6 text-red-500 text-xl">
                    <h2>{error}</h2>
                </div>

            ): null}
        </div>
    );
}
