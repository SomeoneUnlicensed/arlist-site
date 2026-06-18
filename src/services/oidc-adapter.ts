import prisma from './prisma.service.js';

export class PrismaAdapter {
  type: string;

  constructor(name: string) {
    this.type = name;
  }

  async upsert(id: string, payload: any, expiresIn: number) {
    // Clients are stored in OAuthClient table, not OidcModel
    if (this.type === 'Client') return;
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    await prisma.oidcModel.upsert({
      where: { type_id: { type: this.type, id } },
      update: {
        payload,
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        expiresAt,
      },
      create: {
        id,
        type: this.type,
        payload,
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        expiresAt,
      },
    });
  }

  async find(id: string) {
    // Route Client lookups to OAuthClient table
    if (this.type === 'Client') {
      const c = await prisma.oAuthClient.findUnique({ where: { clientId: id } });
      if (!c) return undefined;
      return {
        client_id: c.clientId,
        client_secret: c.clientSecret,
        redirect_uris: c.redirectUris,
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
      };
    }

    const record = await prisma.oidcModel.findUnique({
      where: { type_id: { type: this.type, id } },
    });
    if (!record) return undefined;
    if (record.expiresAt && record.expiresAt < new Date()) return undefined;
    return {
      ...(record.payload as object),
      ...(record.consumedAt ? { consumed: true } : {}),
    };
  }

  async findByUserCode(userCode: string) {
    const record = await prisma.oidcModel.findFirst({
      where: { type: this.type, userCode },
    });
    if (!record) return undefined;
    if (record.expiresAt && record.expiresAt < new Date()) return undefined;
    return {
      ...(record.payload as object),
      ...(record.consumedAt ? { consumed: true } : {}),
    };
  }

  async findByUid(uid: string) {
    const record = await prisma.oidcModel.findFirst({
      where: { type: this.type, uid },
    });
    if (!record) return undefined;
    if (record.expiresAt && record.expiresAt < new Date()) return undefined;
    return {
      ...(record.payload as object),
      ...(record.consumedAt ? { consumed: true } : {}),
    };
  }

  async consume(id: string) {
    await prisma.oidcModel.updateMany({
      where: { type: this.type, id },
      data: { consumedAt: new Date() },
    });
  }

  async destroy(id: string) {
    await prisma.oidcModel.deleteMany({
      where: { type: this.type, id },
    });
  }

  async revokeByGrantId(grantId: string) {
    await prisma.oidcModel.deleteMany({
      where: { grantId },
    });
  }
}
