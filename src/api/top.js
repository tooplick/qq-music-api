/**
 * 排行榜 API
 * GET /api/top - 获取排行榜列表
 * GET /api/top?id=xxx - 获取排行榜详情
 */

import { jsonResponse, errorResponse, handleOptions, buildCommonParams } from "../lib/request.js";
import { generateSign } from "../lib/sign.js";
import { API_CONFIG } from "../lib/common.js";
import { ensureCredentialTable, getCredentialFromDB, parseCredential, saveCredentialToDB } from "../lib/credential.js";

async function getCredential(env) {
    if (!env.DB) return null;
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
        const common = buildCommonParams(credential);

        let requestData;

        if (id) {
            // 获取指定排行榜详情
            requestData = {
                comm: common,
                "music.musicToplist.Toplist": {
                    module: "music.musicToplist.Toplist",
                    method: "GetDetail",
                    param: {
                        topid: parseInt(id),
                        num: num,
                        offset: 0,
                    },
                },
            };
        } else {
            // 获取排行榜列表
            requestData = {
                comm: common,
                "music.musicToplist.Toplist": {
                    module: "music.musicToplist.Toplist",
                    method: "GetAll",
                    param: {},
                },
            };
        }

        const signature = await generateSign(requestData);
        const apiUrl = `${API_CONFIG.endpoint}?sign=${signature}`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://y.qq.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Origin": "https://y.qq.com",
            },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();
        const result = data["music.musicToplist.Toplist"];

        if (!result) {
            return errorResponse("Invalid response", 500);
        }

        return jsonResponse({ code: 0, data: result.data || result });

    } catch (err) {
        console.error("获取排行榜失败:", err);
        return errorResponse(err.message, 500);
    }
}
