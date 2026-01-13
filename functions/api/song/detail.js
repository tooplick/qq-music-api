/**
 * 歌曲详情 API
 * GET /api/song/detail?mid=xxx 或 ?id=xxx
 */

import { apiRequest, jsonResponse, errorResponse, handleOptions } from "../../lib/request.js";
import { ensureCredentialTable, getCredentialFromDB, parseCredential, saveCredentialToDB } from "../../lib/credential.js";

/**
 * 获取凭证
 */
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

    if (request.method === "OPTIONS") {
        return handleOptions();
    }

    if (request.method !== "GET") {
        return errorResponse("Method not allowed", 405);
    }

    try {
        const url = new URL(request.url);
        const mid = url.searchParams.get("mid");
        const id = url.searchParams.get("id");

        if (!mid && !id) {
            return errorResponse("Missing required parameter: mid or id", 400);
        }

        const credential = await getCredential(env);

        // 构建参数
        const params = mid ? { song_mid: mid } : { song_id: parseInt(id) };

        const data = await apiRequest(
            "music.pf_song_detail_svr",
            "get_song_detail_yqq",
            params,
            credential
        );

        return jsonResponse({
            code: 0,
            data: data,
        });

    } catch (err) {
        console.error("获取歌曲详情失败:", err);
        return errorResponse(err.message, 500);
    }
}
