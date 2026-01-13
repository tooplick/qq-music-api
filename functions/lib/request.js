/**
 * 统一请求封装
 * 封装 QQ 音乐 API 请求逻辑
 */

import { generateSign } from "./sign.js";
import { API_CONFIG } from "./common.js";

/**
 * 构建公共请求参数
 * @param {object} credential 凭证对象
 * @returns {object}
 */
export function buildCommonParams(credential) {
    const params = {
        cv: API_CONFIG.versionCode,
        v: API_CONFIG.versionCode,
        QIMEI36: "8888888888888888",
        ct: "11",
        tmeAppID: "qqmusic",
        format: "json",
        inCharset: "utf-8",
        outCharset: "utf-8",
        uid: "3931641530",
    };

    if (credential && credential.musicid && credential.musickey) {
        params.qq = String(credential.musicid);
        params.authst = credential.musickey;
        params.tmeLoginType = String(credential.login_type || 2);
    }

    return params;
}

/**
 * 构建 Cookie 字符串
 * @param {object} credential 凭证对象
 * @returns {string}
 */
export function buildCookies(credential) {
    if (!credential || !credential.musicid || !credential.musickey) {
        return "";
    }
    return [
        `uin=${credential.musicid}`,
        `qqmusic_key=${credential.musickey}`,
        `qm_keyst=${credential.musickey}`,
        `tmeLoginType=${credential.login_type || 2}`,
    ].join("; ");
}

/**
 * 发送 API 请求
 * @param {string} module 模块名
 * @param {string} method 方法名
 * @param {object} params 请求参数
 * @param {object} credential 凭证对象 (可选)
 * @returns {Promise<object>}
 */
export async function apiRequest(module, method, params, credential = null) {
    const common = buildCommonParams(credential);

    const requestData = {
        comm: common,
        [`${module}.${method}`]: {
            module: module,
            method: method,
            param: params,
        },
    };

    const signature = await generateSign(requestData);
    const url = `${API_CONFIG.endpoint}?sign=${signature}`;

    const headers = {
        "Content-Type": "application/json",
        "Referer": "https://y.qq.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://y.qq.com",
    };

    const cookies = buildCookies(credential);
    if (cookies) {
        headers["Cookie"] = cookies;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData),
    });

    const data = await response.json();
    const result = data[`${module}.${method}`];

    if (!result) {
        throw new Error("Invalid response structure");
    }

    if (result.code !== 0) {
        throw new Error(`API error: code=${result.code}`);
    }

    return result.data || result;
}

/**
 * 批量请求 (多个 API 调用合并)
 * @param {Array} requests 请求数组 [{module, method, params}]
 * @param {object} credential 凭证对象
 * @returns {Promise<object>}
 */
export async function batchRequest(requests, credential = null) {
    const common = buildCommonParams(credential);
    const requestData = { comm: common };

    for (const req of requests) {
        const key = `${req.module}.${req.method}`;
        requestData[key] = {
            module: req.module,
            method: req.method,
            param: req.params,
        };
    }

    const signature = await generateSign(requestData);
    const url = `${API_CONFIG.endpoint}?sign=${signature}`;

    const headers = {
        "Content-Type": "application/json",
        "Referer": "https://y.qq.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://y.qq.com",
    };

    const cookies = buildCookies(credential);
    if (cookies) {
        headers["Cookie"] = cookies;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData),
    });

    return await response.json();
}

/**
 * CORS 响应头
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * 创建 JSON 响应
 * @param {object} data 响应数据
 * @param {number} status HTTP 状态码
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
        },
    });
}

/**
 * 创建错误响应
 * @param {string} message 错误信息
 * @param {number} status HTTP 状态码
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
    return jsonResponse({ error: message, code: status }, status);
}

/**
 * 处理 OPTIONS 预检请求
 * @returns {Response}
 */
export function handleOptions() {
    return new Response(null, { headers: corsHeaders });
}
