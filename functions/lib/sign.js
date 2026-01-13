/**
 * 请求签名生成
 * 基于 QQ-Music-Player 现有实现
 */

/**
 * SHA1 哈希 (Web Crypto API)
 * @param {string} text 
 * @returns {Promise<string>}
 */
async function sha1(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * 生成请求签名
 * @param {object} requestData 请求数据对象
 * @returns {Promise<string>} zzc... 格式的签名
 */
export async function generateSign(requestData) {
    const jsonStr = JSON.stringify(requestData);
    const hash = await sha1(jsonStr);

    const part1Indexes = [23, 14, 6, 36, 16, 40, 7, 19].filter(x => x < 40);
    const part1 = part1Indexes.map(i => hash[i] || "").join("");

    const part2Indexes = [16, 1, 32, 12, 19, 27, 8, 5];
    const part2 = part2Indexes.map(i => hash[i] || "").join("");

    const scrambleValues = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179];
    const part3Bytes = new Uint8Array(20);
    for (let i = 0; i < scrambleValues.length; i++) {
        const hexValue = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
        part3Bytes[i] = scrambleValues[i] ^ hexValue;
    }

    let b64Part = btoa(String.fromCharCode(...part3Bytes));
    b64Part = b64Part.replace(/[\\/+=]/g, "");

    return `zzc${part1}${b64Part}${part2}`.toLowerCase();
}
