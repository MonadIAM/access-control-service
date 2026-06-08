const accessToken = pm.collectionVariables.get("access_token");

if (accessToken) {
    pm.request.headers.upsert({
        key: "Authorization",
        value: `Bearer ${accessToken}`,
    });
}
