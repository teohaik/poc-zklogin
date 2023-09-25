"use client";

import {useLayoutEffect, useState} from "react";
import jwt_decode from "jwt-decode";
import {LoginData, LoginResponse} from "@/app/types/Authentication";

import {generateRandomness, jwtToAddress} from '@mysten/zklogin';
import {bigint} from "zod";
import axios from "axios";
import {toBigIntBE} from "bigint-buffer";
import {fromB64} from "@mysten/bcs";

export default function Page() {

    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        try {
            console.log("USE EFFECT");
            const hash = new URLSearchParams(window.location.hash.slice(1));
            const jwt_token_encoded = hash.get("id_token");
            if (jwt_token_encoded) {
                debugger;
                const loginData: LoginData = JSON.parse(localStorage.getItem("loginData")!);

                const decodedJwt = jwt_decode(jwt_token_encoded!) as LoginResponse;
                console.log("decodedJwt Object =", decodedJwt)

                console.log("iat  = " + decodedJwt.iat);
                console.log("iss  = " + decodedJwt.iss);
                console.log("sub = " + decodedJwt.sub);
                console.log("nonce = " + decodedJwt.nonce);

                const userSalt = process.env.NEXT_PUBLIC_USER_SALT!;
                console.log("salt =", userSalt);
                const address = jwtToAddress(jwt_token_encoded!, BigInt(userSalt));
                console.log("address =", address);
                console.log("nonce =", decodedJwt.nonce);
                console.log("ephemeralPublicKey b64 =", loginData.ephemeralPublicKey);

                const epk : Uint8Array = fromB64(loginData.ephemeralPublicKey);
                debugger;
                console.log("epk =", epk);
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
        <div id="bj" className="flex flex-col items-center mt-10">
            <h3>Callback page</h3>

                <div id="header" className="pb-5">
                    <h4>Login with External Provider Completed</h4>
                </div>

                <div id="contents" className="font-medium pb-6">
                    <p>test</p>
                </div>

        </div>
    );
}
