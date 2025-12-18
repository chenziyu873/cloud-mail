import app from '../hono/hono';
import accountService from '../service/account-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/account/list', async (c) => {
	const list = await accountService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(list));
});

app.delete('/account/delete', async (c) => {
	await accountService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/account/add', async (c) => {
	const account = await accountService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(account));
});

app.put('/account/setName', async (c) => {
	await accountService.setName(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/account/setAllReceive', async (c) => {
	await accountService.setAllReceive(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/account/pool/list', async (c) => {
	const data = await accountService.poolList(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/account/pool/delete', async (c) => {
	await accountService.deletePool(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/account/pool/clear', async (c) => {
	await accountService.clearPool(c, userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/account/batch-generate', async (c) => {
	const data = await accountService.batchGenerate(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});
