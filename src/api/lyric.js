/**
 * 歌词 API
 * GET /api/lyric?mid=xxx&qrc=1&trans=1&roma=1
 */

import { apiRequest, jsonResponse, errorResponse, handleOptions } from "../lib/request.js";
import { ensureCredentialTable, getCredentialFromDB, parseCredential, saveCredentialToDB } from "../lib/credential.js";
import { qrc_decrypt } from "../lib/tripledes.js";

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
        const qrc = url.searchParams.get("qrc") === "1" || url.searchParams.get("qrc") === "true";
        const trans = url.searchParams.get("trans") === "1" || url.searchParams.get("trans") === "true";
        const roma = url.searchParams.get("roma") === "1" || url.searchParams.get("roma") === "true";

        if (!mid && !id) {
            return errorResponse("Missing required parameter: mid or id", 400);
        }

        const credential = await getCredential(env);

        // 构造请求参数
        const params = {
            crypt: 1,
            ct: 11,
            cv: 13020508,
            lrc_t: 0,
            qrc: qrc ? 1 : 0,
            qrc_t: 0,
            roma: roma ? 1 : 0,
            roma_t: 0,
            trans: trans ? 1 : 0,
            trans_t: 0,
            type: 1
        };

        if (id) {
            params.songId = parseInt(id);
        } else {
            params.songMid = mid;
        }

        const data = await apiRequest(
            "music.musichallSong.PlayLyricInfo",
            "GetPlayLyricInfo",
            params,
            credential
        );

        const result = {
            code: 0,
            data: {
                mid: mid || "",
                id: id || "",
                lyric: "",
                trans: "",
                roma: "" // 即使没请求也返回空字符串，保持结构一致
            },
        };

        // 解密处理函数
        async function processLyric(content) {
            if (!content) return "";
            // 如果是以 [ 开头，可能是未加密的（虽然 crypt=1 通常都是加密的 hex）
            if (content.startsWith('[')) return content;

            try {
                const decrypted = await qrc_decrypt(content);
                return decrypted || content;
            } catch (e) {
                console.warn("歌词解密失败:", e);
                return "";
            }
        }

        // 处理普通歌词 (LRC)
        if (data.lyric) {
            result.data.lyric = await processLyric(data.lyric);
        }

        // 处理翻译歌词
        if (data.trans) {
            result.data.trans = await processLyric(data.trans);
        }

        // 处理 QRC 歌词 (QRC 也是 hex 加密的)
        if (data.qrc) {
            // QRC 特殊处理：有些字段返回的是 xml 结构，需要提取 content 属性 (参考 python 版本)
            // 但 qrc_decrypt 返回的是解密后的文本。
            // 如果解密后是 XML 格式 <Lyric_1 LyricType="1" LyricContent="..."/>，可能需要正则提取
            // 这里先直接返回解密结果，让前端处理或根据观察调整
            result.data.qrc = await processLyric(data.qrc);
        }

        // 处理罗马音歌词
        if (data.roma) {
            result.data.roma = await processLyric(data.roma);
        }

        return jsonResponse(result);

    } catch (err) {
        console.error("获取歌词失败:", err);
        return errorResponse(err.message, 500);
    }
}
