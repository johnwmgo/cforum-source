// Shows the "needs iOS 12" notice on iOS 11 and older, where the forum's code can't run
// (see "Older iPads" in CLAUDE.md). The notice sits inside #root, so on browsers that can
// run the forum React replaces it on start-up. A classic script in plain ES5 so old Safari
// runs it, and a separate file because the Content-Security-Policy blocks inline scripts.
(function () {
	var m = navigator.userAgent.match(/(?:iPad|iPhone|iPod).*? OS (\d+)_/);
	if (!m || parseInt(m[1], 10) > 11) return;
	var notice = document.getElementById('old-ios-notice');
	if (notice) notice.style.display = 'block';
})();
