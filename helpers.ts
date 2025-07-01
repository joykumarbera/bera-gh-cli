export async function getAppVersionNumber(): Promise<string> {
    try {
    const denoJsonFile = await Deno.readTextFile("deno.json");
        const denoJson = JSON.parse(denoJsonFile);

        return denoJson.version || "1.0.0"; // Default to "1.0.0" if version is not specified
    } catch (error) {
        console.error("Error reading version from deno.json:", error);
        return "";
    }
}