"use client";

import {generateNonce, generateRandomness} from '@mysten/zklogin';
import {useSui} from "@/app/hooks/useSui";
import {useLayoutEffect, useState} from "react";
import {UserKeyData} from "@/app/types/UsefulTypes";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {Keypair, PublicKey} from "@mysten/sui.js/cryptography";

export default function Home() {


    const {suiClient} = useSui();

    const [loginUrl, setLoginUrl] = useState<string | null>();

    async function prepareLogin() {
        const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();


        const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
        const ephemeralKeyPair : Keypair = new Ed25519Keypair();
        const ephemeralPrivateKeyB64 = ephemeralKeyPair.export().privateKey;


        const ephemeralPublicKey : PublicKey = ephemeralKeyPair.getPublicKey()
        const ephemeralPublicKeyB64 = ephemeralPublicKey.toBase64();

        const jwt_randomness = generateRandomness();
        const nonce = generateNonce(ephemeralPublicKey, maxEpoch, jwt_randomness);

        console.log("current epoch = " + epoch);
        console.log("maxEpoch = " + maxEpoch);
        console.log("jwt_randomness = " + jwt_randomness);
        console.log("ephemeral public key = " + ephemeralPublicKeyB64);
        console.log("nonce = " + nonce);

        const userKeyData: UserKeyData = {
            randomness: jwt_randomness.toString(),
            nonce: nonce,
            ephemeralPublicKey: ephemeralPublicKeyB64,
            ephemeralPrivateKey: ephemeralPrivateKeyB64,
            maxEpoch: maxEpoch
        }
        localStorage.setItem("userKeyData", JSON.stringify(userKeyData));
        return userKeyData
    }


    function getRedirectUri() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const customRedirectUri = protocol + "//" + host + "/auth";
        console.log("customRedirectUri = " + customRedirectUri);
        return customRedirectUri;
    }

    useLayoutEffect(() => {

        prepareLogin().then((userKeyData) => {

            const REDIRECT_URI = 'https://zklogin-dev-redirect.vercel.app/api/auth';
            const customRedirectUri = getRedirectUri();
            const params = new URLSearchParams({
                // When using the provided test client ID + redirect site, the redirect_uri needs to be provided in the state.
                state: new URLSearchParams({
                    redirect_uri: customRedirectUri
                }).toString(),
                // Test Client ID for devnet / testnet:
                client_id: '595966210064-3nnnqvmaelqnqsmq448kv05po362smt2.apps.googleusercontent.com',
                redirect_uri: REDIRECT_URI,
                response_type: 'id_token',
                scope: 'openid',
                nonce: userKeyData.nonce,
            });

            setLoginUrl(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        });


    }, []);


    return (

        <div>
            <div className="text-3xl font-bold pb-6">
                <h3>Welcome to the ZK Login Demo Page!</h3>
            </div>

            <div className="flex mt-4 mb-10 space-x-4 justify-center">
                <a href={loginUrl!}
                   className="hover:text-blue-600"
                   target="_blank">

                    <button
                        className="bg-white text-gray-700 hover:text-gray-900 font-semibold py-2 px-4 border rounded-lg flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48"
                             viewBox="0 0 48 48">
                            <path fill="#FFC107"
                                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00"
                                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50"
                                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2"
                                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        <span>Login with Google</span>
                    </button>
                </a>

            </div>


            <div className="bottom-2">
                <footer className="text-center">
                    <a href="https://github.com/teohaik/poc-zklogin"
                       className="hover:text-blue-600"
                       target="_blank">
                        See the Source Code
                    </a>
                </footer>
            </div>

        </div>

    );
}
