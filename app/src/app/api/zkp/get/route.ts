import {NextRequest, NextResponse} from "next/server";
import {kv} from "@vercel/kv";
import {LoginResponse, ZKPRequest} from "@/app/types/UsefulTypes";
import axios from "axios";
import jwt_decode from "jwt-decode";


export async function POST(request: NextRequest) {

    const body = await request.json();
    const zkpRequest = body as ZKPRequest;
    if(!zkpRequest) return NextResponse.json({code: 422, message: "Wrong Body Format!"});

    const decodedJwt: LoginResponse = jwt_decode(zkpRequest.zkpPayload?.jwt!) as LoginResponse;

    console.log("Received request to get proof for subject = ", decodedJwt.sub, " Force Update = ", zkpRequest.forceUpdate);

    const savedProof = await kv.hget(decodedJwt?.sub, "zkp");

    if (savedProof && !zkpRequest.forceUpdate) {
        console.log("ZK Proof found in database.");
        return NextResponse.json({code: 200, zkp: savedProof});
    }
    else{
        const proverResponse = await getZKPFromProver(zkpRequest.zkpPayload);

        if(proverResponse.status !== 200 || !proverResponse.data) {
            return NextResponse.json({code: proverResponse.status, message: proverResponse.statusText});
        }

        const zkpProof = proverResponse.data;
        console.log("ZK Proof created from prover ", zkpProof);

        //Proof is created for first time. We should store it in database before returning it.
        storeProofInDatabase(zkpProof, decodedJwt.sub);

        return NextResponse.json({code: 200, zkp: zkpProof});
    }
}

async function getZKPFromProver(zkpPayload : any) {
    console.log("ZK Proof not found in database. Creating proof from prover...");
    const proverURL = process.env.NEXT_PUBLIC_PROVER_API || "https://prover.mystenlabs.com/v1";
    return await axios.post(proverURL, zkpPayload);
}

function storeProofInDatabase(zkpProof : string, subject: string) {
    kv.hset(subject, { "zkp" : zkpProof } );
    console.log("Proof stored in database.");
}
