/**
 * 排行榜 API
 * GET /api/top - 获取排行榜列表
 * GET /api/top?id=xxx - 获取排行榜详情
 */

import { apiRequest, jsonResponse, errorResponse, handleOptions } from "../lib/request.js";
import { ensureCredentialTable, getCredentialFromDB, parseCredential, saveCredentialToDB } from "../lib/credential.js";

async function getCredential(env) {
    await ensureCredentialTable(env.DB);
    let credential = await getCredentialFromDB(env.DB);
    if (!credential && env.INITIAL_CREDENTIAL) {
        const initial = parseCredential(env.INITIAL_CREDENTIAL);
        if (initial) {
            await saveCredentialToDB(env.DB, initial);
            credential = initial;
        }
    }
    return credential;
}

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "OPTIONS") return handleOptions();
    if (request.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const num = parseInt(url.searchParams.get("num")) || 100;

        const credential = await getCredential(env);

        if (id) {
            // 获取指定排行榜详情
            const params = {
                topId: parseInt(id),
                offset: 0,
                num: num,
            };

            const data = await apiRequest(
                "music.musichallToplist.ToplistInfoServer",
                "GetDetail",
                params,
                credential
            );

            return jsonResponse({ code: 0, data });
        } else {
            // 获取排行榜列表
            const data = await apiRequest(
                "music.musichallToplist.ToplistInfoServer",
                "GetAll",
                {},
                credential
            );

            return jsonResponse({ code: 0, data });
        }

    } catch (err) {
        console.error("获取排行榜失败:", err);
        return errorResponse(err.message, 500);
    }
}
