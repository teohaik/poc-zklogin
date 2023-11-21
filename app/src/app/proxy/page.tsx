"use client"
// import {useRouter} from 'next/router';

export default function Page(params: { searchParams: any }) {
    // const router = useRouter();
    const urlParams = new URLSearchParams(params.searchParams);
    const redirect_uri = urlParams.get("redirect_uri");
    if (redirect_uri) {
        console.log("Got into redirect:", redirect_uri, params)
        window.location.replace(redirect_uri)
        // router.replace(redirect_uri)
        return <></>
    }

    return (
        <>
            <span>Redirect failed. Check URL redirect_uri param</span>
        </>
    );
}
