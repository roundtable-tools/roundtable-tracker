module.exports = (async () => {
	const sharedConfig = await import('../eslint.config.mjs');
	return [...sharedConfig.default];
})();
