import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {PersistentData} from "@/app/types/UserInfo";
export async function POST(request: NextRequest) {

    const body = await request.json();

    console.log("Body received = ", body);
    try {
        const payload: PersistentData = body as PersistentData;
        if (payload && payload.ephemeralPublicKey) {
            console.log("payload = ", payload);
            const result = await kv.hset(payload.ephemeralPublicKey,
                {"ephemeralPublicKey": payload.ephemeralPublicKey,
                    "salt": payload.salt,
                });
            return NextResponse.json({code:200, message: "Data Imported", data: result});
        }
    }catch (e) {
        console.log("Wrong Body Format!. Inner error= ",e);
        return NextResponse.json({code:422, message: "Wrong Body Format!"});
    }
    return NextResponse.json({code:422, message: "Wrong Body Format!"});
}
