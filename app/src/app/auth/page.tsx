"use client";

import {useLayoutEffect, useState} from "react";
import jwt_decode from "jwt-decode";
import {UserKeyData, LoginResponse, PersistentData} from "@/app/types/UserInfo";

import {genAddressSeed, getZkSignature, jwtToAddress, ZkSignatureInputs} from '@mysten/zklogin';
import axios from "axios";
import {toBigIntBE} from "bigint-buffer";
import {fromB64} from "@mysten/bcs";

import {generateRandomness} from '@mysten/zklogin';
import {useSui} from "@/app/hooks/useSui";
import {SerializedSignature, SignatureWithBytes} from "@mysten/sui.js/src/cryptography";
import {ZkSignature} from "@mysten/zklogin/src/bcs";
import {Ed25519Keypair} from "@mysten/sui.js/keypairs/ed25519";
import {TransactionBlock} from '@mysten/sui.js/transactions';

export default function Page() {

    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [txDigest, setTxDigest] = useState<string>("");

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
            console.log("Salt was not created yet! Creating new Salt");
            return generateRandomness().toString();  //TODO: invoke ML API here.
        }
    }


    function storeUserKeyData(encodedJwt: string, subject: string, salt: string, userKeyData: UserKeyData) {
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

    useLayoutEffect(() => {
        try {
            const hash = new URLSearchParams(window.location.hash.slice(1));
            const jwt_token_encoded = hash.get("id_token");
            if (jwt_token_encoded) {

                const userKeyData: UserKeyData = JSON.parse(localStorage.getItem("userKeyData")!);

                let ephemeralKeyPairArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
                const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKeyPairArray);

                const decodedJwt = jwt_decode(jwt_token_encoded!) as LoginResponse;
                console.log("decodedJwt Object =", decodedJwt)

                console.log("iat  = " + decodedJwt.iat);
                console.log("iss  = " + decodedJwt.iss);
                console.log("sub = " + decodedJwt.sub);
                console.log("aud = " + decodedJwt.aud);
                console.log("exp = " + decodedJwt.exp);
                console.log("nonce = " + decodedJwt.nonce);
                console.log("ephemeralPublicKey b64 =", userKeyData.ephemeralPublicKey);

                getSalt(decodedJwt.sub).then((userSalt) => {

                    storeUserKeyData(jwt_token_encoded!, decodedJwt.sub, userSalt!, userKeyData);
                    const address = jwtToAddress(jwt_token_encoded!, BigInt(userSalt!));
                    console.log("address =", address);

                    const ephemeralPublicKeyArray: Uint8Array = fromB64(userKeyData.ephemeralPublicKey);

                    const zkpPayload =
                        {
                            jwt: jwt_token_encoded,
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
                    axios.post('/api/zkp/get', zkpPayload)
                        .then((response) => {
                            console.log("zkp response = ", response.data.zkp);
                            const partialZkSignature: ZkSignatureInputs = response.data.zkp as ZkSignatureInputs;
                            console.log("partialZkSignature = ", partialZkSignature);
                            const txb = new TransactionBlock();

                            txb.moveCall({
                                target: `0xf8294cd69d69d867c5a187a60e7095711ba237fad6718ea371bf4fbafbc5bb4b::teotest::create_weapon`,
                                arguments: [
                                    txb.pure("Super Axe ZKP 9000"),  // weapon name
                                    txb.pure(66),  // weapon damage
                                ],
                            });
                            txb.setGasBudget(100000000);
                            txb.setSender(address);
                            txb.sign({
                                client: suiClient,
                                signer: ephemeralKeyPair
                            }).then((signatureWithBytes: SignatureWithBytes) => {
                                console.log("Got SignatureWithBytes = ", signatureWithBytes);

                                console.log("inputs = ", partialZkSignature);
                                //print maxEpoch
                                console.log("maxEpoch = ", userKeyData.maxEpoch);
                                //print userSignature
                                console.log("userSignature = ", signatureWithBytes.signature);

                                const addressSeed = genAddressSeed(BigInt(userSalt!), "sub", decodedJwt.sub, decodedJwt.aud).toString();
                                const zkSigInputs: ZkSignatureInputs = {
                                    ...partialZkSignature,
                                    addressSeed: addressSeed,
                                }
                                console.log("zkSigInputs = ", zkSigInputs);
                                const zkSignature: SerializedSignature = getZkSignature({
                                    inputs: zkSigInputs,
                                    maxEpoch: userKeyData.maxEpoch,
                                    userSignature: signatureWithBytes.signature,
                                });

                                console.log("Got Zk Signature = ", zkSignature);

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
                                    } else {
                                        console.log("Transaction failed! reason = ", response.effects?.status)
                                    }
                                });
                            });
                        }).catch((error) => {
                        console.log("error = ", error);
                    });
                });
            }
        } catch (e) {
            console.log("error = ", e)
        }
    }, []);

    return (
        <div id="cb" className="flex flex-col items-center mt-10">
            <h1>Callback page</h1>

            <div id="header" className="pb-5 pt-6">
                <h4>Login with External Provider Completed</h4>
            </div>

            {txDigest?.length>0 ? (
                <div>
                    <div id="contents" className="font-medium pb-6">
                        <p>TxDigest = {txDigest}</p>
                    </div>
                    <div id="contents" className="font-medium pb-6">
                        <a href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`}
                           className="hover:text-blue-600"
                           target="_blank">
                            Link on Explorer
                        </a>
                    </div>
                </div>
            ):
                null
            }
        </div>
    );
}
