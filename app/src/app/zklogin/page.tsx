'use client'

import {generateNonce, generateRandomness} from '@mysten/zklogin';
import {Ed25519Keypair} from "@mysten/sui.js";
import {useSui} from "@/app/hooks/useSui";
import {useState} from "react";


export default function zkLogin() {


    const {suiClient} = useSui();

    const [loginUrl, setLoginUrl] = useState<string>();

    init();

    async function init() {

        const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();

        const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
        const ephemeralKeyPair = new Ed25519Keypair();
        const randomness = generateRandomness();
        const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);


        const REDIRECT_URI = 'https://zklogin-dev-redirect.vercel.app/api/auth';

        const params = new URLSearchParams({
            // When using the provided test client ID + redirect site, the redirect_uri needs to be provided in the state.
            state: new URLSearchParams({
                redirect_uri: REDIRECT_URI
            }).toString(),
            // Test Client ID for devnet / testnet:
            client_id: '25769832374-famecqrhe2gkebt5fvqms2263046lj96.apps.googleusercontent.com',
            redirect_uri: 'https://zklogin-dev-redirect.vercel.app/api/auth',
            response_type: 'id_token',
            scope: 'openid',
            // See below for details about generation of the nonce
            nonce: nonce,
        });

        setLoginUrl(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);

    }


    return (
        <div id="bj" className="flex flex-col items-center mt-10">
            <h3>This is the page about zk Login Demo</h3>

            <div className="flex mt-4 mb-10 space-x-4 justify-center">
                <a href={loginUrl}
                   className="hover:text-blue-600"
                   target="_blank">
                    Login with Google
                </a>

            </div>

        </div>

    );
}
