/**
 * 凭证管理工具
 */

/**
 * 解析凭证 JSON
 * @param {string} jsonStr 
 * @returns {object|null}
 */
export function parseCredential(jsonStr) {
    if (!jsonStr) return null;

    try {
        const data = JSON.parse(jsonStr);

        // 解析 extra_fields
        let extraFields = {};
        if (typeof data.extra_fields === "string") {
            try {
                extraFields = JSON.parse(data.extra_fields.replace(/'/g, '"'));
            } catch (e) {
                console.warn("解析 extra_fields 失败:", e);
            }
        } else if (typeof data.extra_fields === "object") {
            extraFields = data.extra_fields;
        }

        return {
            openid: data.openid || "",
            refresh_token: data.refresh_token || "",
            access_token: data.access_token || "",
            expired_at: parseInt(data.expired_at) || 0,
            musicid: String(data.musicid || ""),
            musickey: data.musickey || "",
            unionid: data.unionid || "",
            str_musicid: data.str_musicid || "",
            refresh_key: data.refresh_key || "",
            encrypt_uin: data.encrypt_uin || "",
            login_type: parseInt(data.login_type) || 2,
            musickey_createtime: extraFields.musickeyCreateTime || 0,
            key_expires_in: extraFields.keyExpiresIn || 259200,
        };
    } catch (e) {
        console.error("解析凭证失败:", e);
        return null;
    }
}

/**
 * 确保凭证表存在
 * @param {D1Database} db 
 */
export async function ensureCredentialTable(db) {
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY DEFAULT 1,
            openid TEXT,
            refresh_token TEXT,
            access_token TEXT,
            expired_at INTEGER,
            musicid TEXT,
            musickey TEXT,
            unionid TEXT,
            str_musicid TEXT,
            refresh_key TEXT,
            encrypt_uin TEXT,
            login_type INTEGER DEFAULT 2,
            musickey_createtime INTEGER,
            key_expires_in INTEGER DEFAULT 259200,
            updated_at INTEGER,
            CHECK (id = 1)
        )
    `).run();
}

/**
 * 从数据库获取凭证
 * @param {D1Database} db 
 * @returns {Promise<object|null>}
 */
export async function getCredentialFromDB(db) {
    const result = await db.prepare(
        "SELECT * FROM credentials WHERE id = 1"
    ).first();

    if (!result) return null;

    return {
        openid: result.openid || "",
        refresh_token: result.refresh_token || "",
        access_token: result.access_token || "",
        expired_at: result.expired_at || 0,
        musicid: result.musicid || "",
        musickey: result.musickey || "",
        unionid: result.unionid || "",
        str_musicid: result.str_musicid || "",
        refresh_key: result.refresh_key || "",
        encrypt_uin: result.encrypt_uin || "",
        login_type: result.login_type || 2,
        musickey_createtime: result.musickey_createtime || 0,
        key_expires_in: result.key_expires_in || 259200,
    };
}

/**
 * 保存凭证到数据库
 * @param {D1Database} db 
 * @param {object} credential 
 */
export async function saveCredentialToDB(db, credential) {
    const now = Math.floor(Date.now() / 1000);

    // Check if exists
    const existing = await db.prepare("SELECT id FROM credentials WHERE id = 1").first();

    if (existing) {
        await db.prepare(`
            UPDATE credentials SET 
                openid = ?,
                refresh_token = ?,
                access_token = ?,
                expired_at = ?,
                musicid = ?,
                musickey = ?,
                unionid = ?,
                str_musicid = ?,
                refresh_key = ?,
                encrypt_uin = ?,
                login_type = ?,
                musickey_createtime = ?,
                key_expires_in = ?,
                updated_at = ?
            WHERE id = 1
        `).bind(
            credential.openid,
            credential.refresh_token,
            credential.access_token,
            credential.expired_at,
            credential.musicid,
            credential.musickey,
            credential.unionid,
            credential.str_musicid,
            credential.refresh_key,
            credential.encrypt_uin,
            credential.login_type,
            credential.musickey_createtime,
            credential.key_expires_in,
            now
        ).run();
    } else {
        await db.prepare(`
            INSERT INTO credentials (
                id, openid, refresh_token, access_token, expired_at,
                musicid, musickey, unionid, str_musicid, refresh_key,
                encrypt_uin, login_type, musickey_createtime, key_expires_in, updated_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            credential.openid,
            credential.refresh_token,
            credential.access_token,
            credential.expired_at,
            credential.musicid,
            credential.musickey,
            credential.unionid,
            credential.str_musicid,
            credential.refresh_key,
            credential.encrypt_uin,
            credential.login_type,
            credential.musickey_createtime,
            credential.key_expires_in,
            now
        ).run();
    }
}
