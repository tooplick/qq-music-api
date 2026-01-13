/**
 * 通用工具函数
 * 移植自 L-1124/QQMusicApi 的 utils/common.py
 */

/**
 * 生成随机 GUID (32 位十六进制)
 * @returns {string}
 */
export function getGuid() {
    const chars = "abcdef1234567890";
    let guid = "";
    for (let i = 0; i < 32; i++) {
        guid += chars[Math.floor(Math.random() * chars.length)];
    }
    return guid;
}

/**
 * 生成搜索 ID
 * @returns {string}
 */
export function getSearchID() {
    const e = Math.floor(Math.random() * 20) + 1;
    const t = e * 18014398509481984;
    const n = Math.floor(Math.random() * 4194304) * 4294967296;
    const r = Date.now() % (24 * 60 * 60 * 1000);
    return String(t + n + r);
}

/**
 * Hash33 算法
 * @param {string} s 
 * @param {number} h 
 * @returns {number}
 */
export function hash33(s, h = 0) {
    for (const c of s) {
        h = (h << 5) + h + c.charCodeAt(0);
    }
    return 2147483647 & h;
}

/**
 * 计算 MD5 - 使用 Web Crypto API
 * @param  {...string|Uint8Array} inputs 
 * @returns {Promise<string>}
 */
export async function calcMd5(...inputs) {
    const encoder = new TextEncoder();
    const data = [];
    for (const input of inputs) {
        if (typeof input === "string") {
            data.push(...encoder.encode(input));
        } else if (input instanceof Uint8Array) {
            data.push(...input);
        }
    }
    const hashBuffer = await crypto.subtle.digest("MD5", new Uint8Array(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * API 配置
 */
export const API_CONFIG = {
    version: "13.2.5.8",
    versionCode: 13020508,
    endpoint: "https://u.y.qq.com/cgi-bin/musics.fcg",
};

/**
 * 歌曲文件类型映射
 */
export const SongFileType = {
    FLAC: { s: "F000", e: ".flac" },
    MP3_320: { s: "M800", e: ".mp3" },
    MP3_128: { s: "M500", e: ".mp3" },
    OGG_192: { s: "O600", e: ".ogg" },
    OGG_96: { s: "O400", e: ".ogg" },
    AAC_192: { s: "C600", e: ".m4a" },
    AAC_96: { s: "C400", e: ".m4a" },
    AAC_48: { s: "C200", e: ".m4a" },
};

/**
 * 搜索类型枚举
 */
export const SearchType = {
    SONG: 0,
    SINGER: 1,
    ALBUM: 2,
    PLAYLIST: 3,
    MV: 4,
    LYRIC: 7,
    USER: 8,
};

/**
 * 解析搜索类型字符串
 * @param {string} type 
 * @returns {number}
 */
export function parseSearchType(type) {
    const typeMap = {
        song: SearchType.SONG,
        singer: SearchType.SINGER,
        album: SearchType.ALBUM,
        playlist: SearchType.PLAYLIST,
        mv: SearchType.MV,
        lyric: SearchType.LYRIC,
        user: SearchType.USER,
    };
    return typeMap[type?.toLowerCase()] ?? SearchType.SONG;
}

/**
 * 解析音质字符串
 * @param {string|number} quality 
 * @returns {object}
 */
export function parseQuality(quality) {
    const qualityMap = {
        flac: SongFileType.FLAC,
        320: SongFileType.MP3_320,
        128: SongFileType.MP3_128,
        192: SongFileType.OGG_192,
        96: SongFileType.OGG_96,
    };
    return qualityMap[String(quality).toLowerCase()] ?? SongFileType.MP3_128;
}
