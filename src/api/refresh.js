/**
 * Cloudflare Pages Function - 凭证刷新
 * POST /api/refresh - 手动刷新凭证
 * Cron triggered - 自动刷新
 */

import {
    ensureCredentialTable,
    getCredentialFromDB,
    saveCredentialToDB
} from "../lib/credential.js";
import { buildCommonParams, buildCookies, jsonResponse, errorResponse, handleOptions } from "../lib/request.js";
import { generateSign } from "../lib/sign.js";
import { API_CONFIG } from "../lib/common.js";

/**
 * 刷新凭证
 * @param {object} credential 
 * @returns {Promise<object>}
 */
async function refreshCredential(credential) {
    if (!credential.refresh_key) {
        throw new Error("缺少 refresh_key");
    }

    const params = {
        refresh_key: credential.refresh_key,
        refresh_token: credential.refresh_token,
        musickey: credential.musickey,
        musicid: credential.musicid,
    };

    const common = buildCommonParams(credential);
    const requestData = {
        comm: common,
        "music.login.LoginServer.Login": {
            module: "music.login.LoginServer",
            method: "Login",
            param: params,
        },
    };

    const signature = await generateSign(requestData);
    const url = `${API_CONFIG.endpoint}?sign=${signature}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Referer": "https://y.qq.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://y.qq.com",
            "Cookie": buildCookies(credential),
        },
        body: JSON.stringify(requestData),
    });

    const data = await response.json();
    const result = data["music.login.LoginServer.Login"];

    if (!result || result.code !== 0) {
        throw new Error(`刷新失败: code=${result?.code}`);
    }

    return result.data;
}

/**
 * 执行刷新逻辑
 * @param {D1Database} db 
 * @param {boolean} force 强制刷新
 * @returns {Promise<object>}
 */
async function doRefresh(db, force = false) {
    await ensureCredentialTable(db);

    const credential = await getCredentialFromDB(db);
    if (!credential) {
        return { success: false, message: "未找到凭证" };
    }

    const now = Math.floor(Date.now() / 1000);
    const createTime = credential.musickey_createtime || 0;
    const expiresIn = credential.key_expires_in || 259200;
    const expireTime = createTime + expiresIn;
    const remainingTime = expireTime - now;

    console.log(`[Refresh] 凭证剩余有效期: ${Math.floor(remainingTime / 3600)} 小时`);

    // 如果剩余时间少于 24 小时或强制刷新
    if (remainingTime < 24 * 3600 || force) {
        console.log("[Refresh] 开始刷新凭证...");

        const newData = await refreshCredential(credential);

        // 更新凭证
        const updatedCredential = {
            ...credential,
            musickey: newData.musickey || credential.musickey,
            musicid: newData.musicid || credential.musicid,
            refresh_key: newData.refresh_key || credential.refresh_key,
            refresh_token: newData.refresh_token || credential.refresh_token,
            musickey_createtime: now,
            key_expires_in: newData.keyExpiresIn || 259200,
        };

        await saveCredentialToDB(db, updatedCredential);

        console.log("[Refresh] 凭证刷新成功");
        return { success: true, message: "凭证刷新成功" };
    }

    return { success: true, message: "凭证有效期充足，无需刷新" };
}

/**
 * Cron 触发器入口
 */
export async function onSchedule(context) {
    const { env } = context;

    try {
        console.log("[Cron] 开始检查凭证状态...");
        const result = await doRefresh(env.DB, false);
        console.log(`[Cron] ${result.message}`);
    } catch (err) {
        console.error("[Cron] 刷新凭证失败:", err);
    }
}

/**
 * HTTP 触发器
 * POST /api/refresh - 手动刷新
 */
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "OPTIONS") {
        return handleOptions();
    }

    if (request.method !== "POST") {
        return errorResponse("Method not allowed", 405);
    }

    try {
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "true";

        const result = await doRefresh(env.DB, force);
        return jsonResponse(result);
    } catch (err) {
        console.error("刷新凭证失败:", err);
        return errorResponse(err.message, 500);
    }
}
