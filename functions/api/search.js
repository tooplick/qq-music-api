/**
 * 搜索 API
 * GET /api/search?keyword=xxx&type=song&num=10&page=1
 */

import { apiRequest, jsonResponse, errorResponse, handleOptions } from "../lib/request.js";
import { getSearchID, parseSearchType, SearchType } from "../lib/common.js";
import { ensureCredentialTable, getCredentialFromDB, parseCredential, saveCredentialToDB } from "../lib/credential.js";

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
        const keyword = url.searchParams.get("keyword") || url.searchParams.get("q");
        const type = url.searchParams.get("type") || "song";
        const num = parseInt(url.searchParams.get("num")) || 10;
        const page = parseInt(url.searchParams.get("page")) || 1;
        const highlight = url.searchParams.get("highlight") !== "false";

        if (!keyword) {
            return errorResponse("Missing required parameter: keyword", 400);
        }

        const credential = await getCredential(env);
        const searchType = parseSearchType(type);

        const params = {
            searchid: getSearchID(),
            query: keyword,
            search_type: searchType,
            num_per_page: num,
            page_num: page,
            highlight: highlight ? 1 : 0,
            grp: 1,
        };

        const data = await apiRequest(
            "music.search.SearchCgiService",
            "DoSearchForQQMusicMobile",
            params,
            credential
        );

        // 根据类型提取结果
        const typeKeys = {
            [SearchType.SONG]: "item_song",
            [SearchType.SINGER]: "singer",
            [SearchType.ALBUM]: "item_album",
            [SearchType.PLAYLIST]: "item_songlist",
            [SearchType.MV]: "item_mv",
            [SearchType.LYRIC]: "item_song",
            [SearchType.USER]: "item_user",
        };

        const resultKey = typeKeys[searchType] || "item_song";
        const items = data.body?.[resultKey] || [];

        return jsonResponse({
            code: 0,
            data: {
                keyword: keyword,
                type: type,
                page: page,
                num: num,
                total: data.meta?.sum || items.length,
                list: items,
            },
        });

    } catch (err) {
        console.error("搜索失败:", err);
        return errorResponse(err.message, 500);
    }
}
