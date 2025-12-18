import orm from '../entity/orm';
import targetUser from '../entity/target-user';
import { and, asc, eq, count, inArray, desc } from 'drizzle-orm';
import verifyUtils from '../utils/verify-utils';

const targetUserService = {

    async list(c, params, userId) {
        let { num, size, email } = params;
        num = Number(num);
        size = Number(size);
        if (size > 100) size = 100;
        const offset = (num - 1) * size;

        const conditions = [eq(targetUser.userId, userId)];
        if (email) {
            conditions.push(eq(targetUser.email, email));
        }

        const list = await orm(c).select().from(targetUser)
            .where(and(...conditions))
            .orderBy(desc(targetUser.targetUserId))
            .limit(size)
            .offset(offset)
            .all();

        const { total } = await orm(c).select({ total: count() }).from(targetUser).where(and(...conditions)).get();
        return { list, total };
    },

    async batchImport(c, emails, userId) {
        const validEmails = emails.filter(email => verifyUtils.isEmail(email));
        if (validEmails.length === 0) return { count: 0 };

        // 分片插入，防止 SQL 过长 (SQLite 变量限制为 1000)
        const chunkSize = 10;
        let importedCount = 0;

        for (let i = 0; i < validEmails.length; i += chunkSize) {
            const chunk = validEmails.slice(i, i + chunkSize);
            const values = chunk.map(email => ({
                email: email,
                userId: userId
            }));
            await orm(c).insert(targetUser).values(values).run();
            importedCount += chunk.length;
        }

        return { count: importedCount };
    },

    async delete(c, params, userId) {
        const { targetUserIds } = params;
        const idList = targetUserIds.split(',').map(Number);
        await orm(c).delete(targetUser).where(and(eq(targetUser.userId, userId), inArray(targetUser.targetUserId, idList))).run();
    },

    async clear(c, userId) {
        await orm(c).delete(targetUser).where(eq(targetUser.userId, userId)).run();
    },

    async add(c, email, userId) {
        if (!verifyUtils.isEmail(email)) throw new Error('Invalid Email');
        await orm(c).insert(targetUser).values({ email, userId }).run();
    }
};

export default targetUserService;
