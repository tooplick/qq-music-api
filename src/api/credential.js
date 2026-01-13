/**
 * Cloudflare Pages Function - 凭证读取 API
 * GET /api/credential - 返回当前凭证
 */

import {
    parseCredential,
    ensureCredentialTable,
    getCredentialFromDB,
    saveCredentialToDB
} from "../lib/credential.js";
import { jsonResponse, errorResponse, handleOptions } from "../lib/request.js";

export async function onRequest(context) {
    const { request, env } = context;

    // CORS 预检
    if (request.method === "OPTIONS") {
        return handleOptions();
    }

    if (request.method !== "GET") {
        return errorResponse("Method not allowed", 405);
    }

    // 检查数据库绑定
    if (!env.DB) {
        return errorResponse("D1 database not bound. Please configure D1 binding in Cloudflare Dashboard.", 503);
    }

    try {
        // 确保表存在
        await ensureCredentialTable(env.DB);

        // 尝试从数据库获取凭证
        let credential = await getCredentialFromDB(env.DB);

        // 如果没有凭证，尝试从环境变量初始化
        if (!credential && env.INITIAL_CREDENTIAL) {
            const initialCredential = parseCredential(env.INITIAL_CREDENTIAL);
            if (initialCredential) {
                await saveCredentialToDB(env.DB, initialCredential);
                credential = initialCredential;
                console.log("初始凭证已从环境变量导入");
            }
        }

        if (!credential) {
            return jsonResponse({
                error: "No credential found. Please set INITIAL_CREDENTIAL secret.",
                credential: null
            }, 404);
        }

        // 构建返回格式
        const response = {
            credential: {
                ...credential,
                extra_fields: {
                    musickeyCreateTime: credential.musickey_createtime,
                    keyExpiresIn: credential.key_expires_in,
                },
            },
        };

        // 移除内部字段
        delete response.credential.musickey_createtime;
        delete response.credential.key_expires_in;

        return jsonResponse(response);

    } catch (err) {
        console.error("读取凭证失败:", err);
        return errorResponse(err.message, 500);
    }
}
