"use client";

import {useLayoutEffect, useState} from "react";
import jwt_decode from "jwt-decode";
import {LoginData, LoginResponse} from "@/app/types/UserInfo";

import {jwtToAddress} from '@mysten/zklogin';
import axios from "axios";
import {toBigIntBE} from "bigint-buffer";
import {fromB64} from "@mysten/bcs";

import {generateRandomness} from '@mysten/zklogin';

export default function Page() {

    const [publicKey, setPublicKey] = useState<string | null>(null);

    useLayoutEffect(() => {
        try {
            const hash = new URLSearchParams(window.location.hash.slice(1));
            const jwt_token_encoded = hash.get("id_token");
            if (jwt_token_encoded) {

                const loginData: LoginData = JSON.parse(localStorage.getItem("loginData")!);

                const decodedJwt = jwt_decode(jwt_token_encoded!) as LoginResponse;
                console.log("decodedJwt Object =", decodedJwt)

                console.log("iat  = " + decodedJwt.iat);
                console.log("iss  = " + decodedJwt.iss);
                console.log("sub = " + decodedJwt.sub);
                console.log("aud = " + decodedJwt.aud);
                console.log("exp = " + decodedJwt.exp);

                const userSalt = generateRandomness().toString();
                console.log("salt =", userSalt);


                const address = jwtToAddress(jwt_token_encoded!, BigInt(userSalt));
                console.log("address =", address);
                console.log("salt =", decodedJwt.nonce);
                console.log("ephemeralPublicKey b64 =", loginData.ephemeralPublicKey);

               // dbClient.hset(loginData.ephemeralPublicKey, { "address" : address});
              //  dbClient.hset(loginData.ephemeralPublicKey, { "salt" : userSalt});

                const epk : Uint8Array = fromB64(loginData.ephemeralPublicKey);

                const zkpPayload =
                    {
                        jwt: jwt_token_encoded,
                        extendedEphemeralPublicKey: toBigIntBE(
                            Buffer.from(epk),
                        ).toString(),
                        jwtRandomness: loginData.randomness,
                        maxEpoch: "10",
                        salt: userSalt,
                        keyClaimName: "sub"
                    };
                console.log("about to post zkpPayload = ", zkpPayload);
                setPublicKey(zkpPayload.extendedEphemeralPublicKey);
                axios.post('https://prover.mystenlabs.com/v1', zkpPayload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': '*',
                            'Access-Control-Allow-Methods': 'POST'
                        }
                    }).then((response) => {
                    console.log("response = ", response.data);
                }).catch((error) => {
                    console.log("error = ", error);
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

                <div id="contents" className="font-medium pb-6">
                    <p>ZKP Ephemeral Public Key  =  {publicKey}</p>
                </div>

        </div>
    );
}
