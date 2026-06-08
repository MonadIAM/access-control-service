const authorizationHeader = pm.response.headers.get("authorization");

if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    const accessToken = authorizationHeader.slice("Bearer ".length);

    pm.collectionVariables.set("access_token", accessToken);
}

const setCookies = pm.response.headers
    .all()
    .filter((header) => header.key.toLowerCase() === "set-cookie")
    .map((header) => header.value);

for (const setCookie of setCookies) {
    const refreshMatches = setCookie.match(/refresh_token=([^;]+)/);

    if (refreshMatches && refreshMatches[1]) {
        pm.collectionVariables.set("refresh_token", refreshMatches[1]);
    }

    const pendingMatches = setCookie.match(/pending_token=([^;]+)/);

    if (pendingMatches && pendingMatches[1]) {
        pm.collectionVariables.set("pending_token", pendingMatches[1]);
    }
}
