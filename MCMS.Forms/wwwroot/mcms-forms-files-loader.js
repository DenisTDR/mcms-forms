const mcmsFormsStaticFilesLoader = {
    loadScripts: (srcs) => {
        mcmsFormsStaticFilesLoader.loadNextScript(srcs, 0);
    },
    loadNextScript: (srcs, idx) => {
        if (idx >= srcs.length) return;
        
        mcmsFormsStaticFilesLoader.loadScript(srcs[idx], () => {
            mcmsFormsStaticFilesLoader.loadNextScript(srcs, idx + 1);
        });
    },
    loadScript: (src, callback) => {
        const script = document.createElement('script');
        script.src = src;
        script.onerror = (e) => {
            if (mcmsFormsStaticFilesLoader.loadError) {
                return;
            }
            mcmsFormsStaticFilesLoader.loadError = true;
            console.error(e);
            alert('Couldn\'t load MCMS Forms scripts. Please try refreshing the page.');
        };
        script.onload = (e) => {
            console.log('script loaded');
            callback();
        }
        document.body.appendChild(script);
    },
    loadError: false,
}