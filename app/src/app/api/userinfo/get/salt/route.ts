import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {PersistentData} from "@/app/types/UserInfo";
export async function POST(request: NextRequest) {

    const body = await request.json();
    try {
        const dataRequest: PersistentData = body as PersistentData;
        if (dataRequest && dataRequest.subject) {
            console.log("Received request for FETCHING Salt for subject ", dataRequest.subject);
            const result = await kv.get(dataRequest.subject);
            if(result) {
                return NextResponse.json({status: 200, statusText: "OK", data: result});
            }
            else
                return NextResponse.json({status:404, statusText: "No data found"});
        }
    }catch (e) {
        console.log("Wrong Request Body Format!. Inner error= ",e);
        return NextResponse.json({status:422, statusText: "Wrong Body Format!"});
    }
    return NextResponse.json({status:422, statusText: "Wrong Body Format!"});

}
