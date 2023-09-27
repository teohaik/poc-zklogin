import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {PersistentData} from "@/app/types/UserInfo";
export async function POST(request: NextRequest) {

    const body = await request.json();
    console.log("Body received = ", body);
    try {
        const payload: PersistentData = body as PersistentData;
        if (payload && payload.ephemeralPublicKey && payload.subject && payload.salt) {
            console.log("payload received for storage for subject ", payload.subject);
            const result = await kv.set(payload.subject, JSON.stringify(payload));
            return NextResponse.json({status:200, message: result});
        }
    }catch (e) {
        console.log("Wrong Body Format!. Inner error= ",e);
        return NextResponse.json({status:422, message: "Wrong Body Format!"});
    }
    return NextResponse.json({status:422, message: "Wrong Body Format!"});
}
