"use client"

export default function Page() {

    const urlParamsString = window.location.search
    const urlParams = new URLSearchParams(urlParamsString);
    const redirect_uri = urlParams.get("redirect_uri")

    if (redirect_uri) {
        // console.log("Got into redirect:", redirect_uri)
        window.location.replace(redirect_uri)
        return <></>
    }

    return (
        <>
            <span>Redirect failed. Check URL redirect_uri param</span>
        </>
    );
}
