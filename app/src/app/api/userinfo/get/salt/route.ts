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
            const result = await kv.hget(payload.ephemeralPublicKey, "salt");
            if(result)
                return NextResponse.json({code:200, message:"OK", data: result } );
            else
                return NextResponse.json({code:404, message: "No data found"});
        }
    }catch (e) {
        console.log("Wrong Request Body Format!. Inner error= ",e);
        return NextResponse.json({code:422, message: "Wrong Body Format!"});
    }
    return NextResponse.json({code:422, message: "Wrong Body Format!"});
}
