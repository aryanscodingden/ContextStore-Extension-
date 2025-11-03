import * as vscode from 'vscode';

const ACCESS_KEY = 'contextstore_access_token';
const REFRESH_KEY = 'contextstore_refresh_token';

export class SecretBag {
  constructor(private secrets:vscode.SecretStorage) {}
  static init(ctx: vscode.ExtensionContext) {
    return new SecretBag(ctx.secrets);
  }

  async save(access_token: string, refresh_token: string) {
    await this.secrets.store(ACCESS_KEY, access_token);
    await this.secrets.store(REFRESH_KEY, refresh_token);
  }

  async load(): Promise<{ access_token?: string; refresh_token?: string }> {
    const access_token = await this.secrets.get(ACCESS_KEY);
    const refresh_token = await this.secrets.get(REFRESH_KEY);
    return { access_token, refresh_token };
  }

  async clear() {
    await this.secrets.delete(ACCESS_KEY);
    await this.secrets.delete(REFRESH_KEY);
  }
}
