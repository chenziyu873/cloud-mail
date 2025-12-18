import app from '../hono/hono';
import targetUserService from '../service/target-user-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/target-user/list', async (c) => {
    const data = await targetUserService.list(c, c.req.query(), userContext.getUserId(c));
    return c.json(result.ok(data));
});

app.post('/target-user/import', async (c) => {
    const { emails } = await c.req.json();
    const data = await targetUserService.batchImport(c, emails, userContext.getUserId(c));
    return c.json(result.ok(data));
});

app.post('/target-user/add', async (c) => {
    const { email } = await c.req.json();
    await targetUserService.add(c, email, userContext.getUserId(c));
    return c.json(result.ok());
});

app.delete('/target-user/delete', async (c) => {
    await targetUserService.delete(c, c.req.query(), userContext.getUserId(c));
    return c.json(result.ok());
});

app.delete('/target-user/clear', async (c) => {
    await targetUserService.clear(c, userContext.getUserId(c));
    return c.json(result.ok());
});
