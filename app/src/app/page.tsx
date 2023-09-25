"use client";

import {generateNonce, generateRandomness} from '@mysten/zklogin';
import {useSui} from "@/app/hooks/useSui";
import {useLayoutEffect, useState} from "react";
import {LoginData} from "@/app/types/Authentication";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {toB64} from "@mysten/bcs";

export default function Home() {


    const {suiClient} = useSui();
    const [error, setError] = useState<string | null>(null);

    const [loginData, setLoginData] = useState<string | null>(null);
    const [loginUrl, setLoginUrl] = useState<string | null>();

    const [loginDone, setLoginDone] = useState<boolean>(false);

    async function prepareLogin() {
        const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();

        const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
        const ephemeralKeyPair = new Ed25519Keypair();
        const ephemeralPublicKey = ephemeralKeyPair.getPublicKey()
        const jwt_randomness = generateRandomness();
        const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, jwt_randomness);

        console.log("epoch = " + epoch);
        console.log("nonce = " + nonce);
        console.log("ephemeral public key = " + ephemeralPublicKey);
        console.log("ephemeral public key b64 = " + toB64(ephemeralPublicKey.toSuiBytes()));

        const loginData: LoginData = {
            randomness: jwt_randomness.toString(),
            nonce: nonce,
            ephemeralPublicKey: toB64(ephemeralPublicKey.toSuiBytes())
        }
        localStorage.setItem("loginData", JSON.stringify(loginData));
        return loginData
    }


    useLayoutEffect(() => {

        prepareLogin().then((loginData) => {

            const REDIRECT_URI = 'https://zklogin-dev-redirect.vercel.app/api/auth';
            const protocol = window.location.protocol;
            const host = window.location.host;
            const customRedirectUri = protocol + "//" + host + "/auth";
            console.log("customRedirectUri = " + customRedirectUri);
            const params = new URLSearchParams({
                // When using the provided test client ID + redirect site, the redirect_uri needs to be provided in the state.
                state: new URLSearchParams({
                    redirect_uri: customRedirectUri
                }).toString(),
                // Test Client ID for devnet / testnet:
                client_id: '25769832374-famecqrhe2gkebt5fvqms2263046lj96.apps.googleusercontent.com',
                redirect_uri: REDIRECT_URI,
                response_type: 'id_token',
                scope: 'openid',
                // See below for details about generation of the nonce
                nonce: loginData.nonce,
            });

            setLoginUrl(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        });


    }, []);


    return (

        <div>
            <div className="text-3xl font-bold pb-6">
                <h3>This is the page about zk Login Demo</h3>
            </div>

            <div className="flex mt-4 mb-10 space-x-4 justify-center">
                <a href={loginUrl!}
                   className="hover:text-blue-600"
                   target="_blank">
                    <button
                        className="bg-white text-gray-700 hover:text-gray-900 font-semibold py-2 px-4 border rounded-lg flex items-center space-x-2">
                        <span>Login with Google</span>
                    </button>
                </a>
            </div>

        </div>

    );
}
