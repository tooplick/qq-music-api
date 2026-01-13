/**
 * 歌曲播放链接 API
 * GET /api/song/url?mid=xxx&quality=128
 */

import { batchRequest, jsonResponse, errorResponse, handleOptions } from "../../lib/request.js";
import { getGuid, parseQuality, SongFileType } from "../../lib/common.js";
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
        const midParam = url.searchParams.get("mid");
        const quality = url.searchParams.get("quality") || "128";

        if (!midParam) {
            return errorResponse("Missing required parameter: mid", 400);
        }

        // 支持逗号分隔的多个 MID
        const mids = midParam.split(",").map(m => m.trim()).filter(Boolean);

        if (mids.length === 0) {
            return errorResponse("Invalid mid parameter", 400);
        }

        const credential = await getCredential(env);
        const fileType = parseQuality(quality);
        const domain = "https://isure.stream.qqmusic.qq.com/";

        // 构建文件名
        const fileNames = mids.map(mid => `${fileType.s}${mid}${mid}${fileType.e}`);

        const params = {
            filename: fileNames,
            guid: getGuid(),
            songmid: mids,
            songtype: mids.map(() => 0),
        };

        // 使用更高的 ct 值以获取更好的结果
        const requestData = {
            comm: {
                ct: "19",
                cv: 13020508,
                v: 13020508,
                format: "json",
            },
            "music.vkey.GetVkey.UrlGetVkey": {
                module: "music.vkey.GetVkey",
                method: "UrlGetVkey",
                param: params,
            },
        };

        // 添加凭证
        if (credential) {
            requestData.comm.qq = String(credential.musicid);
            requestData.comm.authst = credential.musickey;
            requestData.comm.tmeLoginType = String(credential.login_type || 2);
        }

        const { generateSign } = await import("../../lib/sign.js");
        const { API_CONFIG } = await import("../../lib/common.js");
        const { buildCookies } = await import("../../lib/request.js");

        const signature = await generateSign(requestData);
        const apiUrl = `${API_CONFIG.endpoint}?sign=${signature}`;

        const headers = {
            "Content-Type": "application/json",
            "Referer": "https://y.qq.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://y.qq.com",
        };

        if (credential) {
            headers["Cookie"] = buildCookies(credential);
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestData),
        });

        const data = await response.json();
        const result = data["music.vkey.GetVkey.UrlGetVkey"];

        if (!result || result.code !== 0) {
            return errorResponse(`获取链接失败: code=${result?.code}`, 500);
        }

        // 解析结果
        const urls = {};
        const midurlinfo = result.data?.midurlinfo || [];

        for (const info of midurlinfo) {
            const purl = info.purl || info.wifiurl || "";
            urls[info.songmid] = purl ? domain + purl : "";
        }

        return jsonResponse({
            code: 0,
            data: urls,
            quality: quality,
        });

    } catch (err) {
        console.error("获取歌曲链接失败:", err);
        return errorResponse(err.message, 500);
    }
}
