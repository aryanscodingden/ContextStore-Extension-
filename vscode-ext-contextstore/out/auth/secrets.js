"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretBag = void 0;
const ACCESS_KEY = 'contextstore_access_token';
const REFRESH_KEY = 'contextstore_refresh_token';
class SecretBag {
    secrets;
    constructor(secrets) {
        this.secrets = secrets;
    }
    static init(ctx) {
        return new SecretBag(ctx.secrets);
    }
    async save(access_token, refresh_token) {
        await this.secrets.store(ACCESS_KEY, access_token);
        await this.secrets.store(REFRESH_KEY, refresh_token);
    }
    async load() {
        const access_token = await this.secrets.get(ACCESS_KEY);
        const refresh_token = await this.secrets.get(REFRESH_KEY);
        return { access_token, refresh_token };
    }
    async clear() {
        await this.secrets.delete(ACCESS_KEY);
        await this.secrets.delete(REFRESH_KEY);
    }
}
exports.SecretBag = SecretBag;
//# sourceMappingURL=secrets.js.map