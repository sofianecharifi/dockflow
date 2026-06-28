export function createContainerCard(container) {

    const card = document.createElement('div');
    card.className = "bg-[#1e293b] border border-white/[0.04] rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-blue-500/10 hover:border-blue-500/30 hover:-translate-y-1";

    const headerDiv = document.createElement('div');
    headerDiv.className = "p-5 flex-grow";

    const titleRow = document.createElement('div');
    titleRow.className = "flex justify-between items-start mb-4";

    const titleGroup = document.createElement('div');
    titleGroup.className = "min-w-0 flex-1 pr-4";

    const title = document.createElement('h3');
    title.className = "text-lg font-bold text-white flex items-center gap-2 truncate";
    // remove slash from name
    title.textContent = container.name || "App Inconnue";

    const subtitle = document.createElement('p');
    subtitle.className = "text-sm text-slate-400 mt-1 truncate";
    subtitle.textContent = container.image || "Image inconnue";

    titleGroup.appendChild(title);
    titleGroup.appendChild(subtitle);

    const badgeContainer = document.createElement('span');
    badgeContainer.className = "flex h-3 w-3 relative flex-shrink-0 mt-1.5";

    const isRunning = container.state === 'running';

    if (isRunning) {
        // ping effect
        const ping = document.createElement('span');
        ping.className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75";
        const dot = document.createElement('span');
        dot.className = "relative inline-flex rounded-full h-3 w-3 bg-emerald-500";
        badgeContainer.appendChild(ping);
        badgeContainer.appendChild(dot);
    } else {
        const dot = document.createElement('span');
        dot.className = "relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-red-900";
        badgeContainer.appendChild(dot);
    }

    titleRow.appendChild(titleGroup);
    titleRow.appendChild(badgeContainer);


    // set container id to update easily
    card.dataset.containerId = container.id;
    card.dataset.containerName = container.name || '';
    card.dataset.currentState = container.state;

    const statusText = document.createElement('p');
    statusText.className = `text-sm font-medium ${isRunning ? 'text-emerald-400' : 'text-red-400'}`;
    // ex: 'Up 2 hours'
    statusText.textContent = container.status || (isRunning ? 'En ligne' : 'Stoppé');
    statusText.dataset.statStatus = container.id;

    headerDiv.appendChild(titleRow);
    headerDiv.appendChild(statusText);

    // Stats Div
    const statsDiv = document.createElement('div');
    statsDiv.className = "mt-4 flex items-center justify-between bg-black/20 rounded-xl p-4";

    // RAM
    const ramDiv = document.createElement('div');
    const ramLabel = document.createElement('p');
    ramLabel.className = "text-xs text-slate-400 font-medium mb-1";
    ramLabel.textContent = "RAM";
    const ramValue = document.createElement('p');
    ramValue.className = "text-sm font-bold text-white";
    ramValue.textContent = isRunning ? "Chargement..." : "0 B";
    ramValue.dataset.statRam = container.id;
    ramDiv.appendChild(ramLabel);
    ramDiv.appendChild(ramValue);

    // Disk
    const diskDiv = document.createElement('div');
    diskDiv.className = "text-right";
    const diskLabel = document.createElement('p');
    diskLabel.className = "text-xs text-slate-400 font-medium mb-1";
    diskLabel.textContent = "Espace Disque";
    const diskValue = document.createElement('p');
    diskValue.className = "text-sm font-bold text-white";
    diskValue.textContent = "Chargement...";
    diskValue.dataset.statDisk = container.id;
    diskDiv.appendChild(diskLabel);
    diskDiv.appendChild(diskValue);

    statsDiv.appendChild(ramDiv);
    statsDiv.appendChild(diskDiv);

    headerDiv.appendChild(statsDiv);


    const actionsDiv = document.createElement('div');
    actionsDiv.className = "bg-slate-800/50 p-4 border-t border-slate-700 grid grid-cols-2 gap-2";

    // btn helper
    const createBtn = (text, customClasses, actionType) => {
        const btn = document.createElement('button');
        btn.className = `col-span-1 text-xs font-medium py-2 px-3 rounded-lg flex justify-center items-center gap-1 transition-colors ${customClasses}`;
        btn.textContent = text;

        btn.dataset.action = actionType;
        btn.dataset.id = container.id;
        return btn;
    };

    if (isRunning) {
        const stopBtn = createBtn('Stopper', 'bg-slate-700 hover:bg-slate-600 text-white', 'stop');
        const restartBtn = createBtn('Redémarrer', 'bg-slate-700 hover:bg-slate-600 text-white', 'restart');
        actionsDiv.appendChild(stopBtn);
        actionsDiv.appendChild(restartBtn);
    } else {
        const startBtn = createBtn('Démarrer', 'col-span-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30', 'start');
        actionsDiv.appendChild(startBtn);
    }

    // logs btn
    const logsBtn = createBtn('Logs', 'bg-slate-700 hover:bg-slate-600 text-white', 'logs');
    logsBtn.classList.replace('col-span-1', 'col-span-2');
    actionsDiv.appendChild(logsBtn);

    // pull btn
    const pullBtn = document.createElement('button');
    pullBtn.className = "col-span-2 mt-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-xs font-medium py-2 flex justify-center items-center gap-1 transition-colors rounded-lg";
    pullBtn.textContent = "Pull l'image & Recréer";
    pullBtn.dataset.action = 'pull';
    pullBtn.dataset.id = container.id;
    actionsDiv.appendChild(pullBtn);

    // delete btn
    const deleteBtn = document.createElement('button');
    deleteBtn.className = "col-span-2 mt-1 text-red-400 hover:text-red-300 text-xs font-medium py-2 flex justify-center items-center gap-1 transition-colors";
    deleteBtn.textContent = "Supprimer l'application";
    deleteBtn.dataset.action = 'remove';
    deleteBtn.dataset.id = container.id;
    actionsDiv.appendChild(deleteBtn);

    card.appendChild(headerDiv);
    card.appendChild(actionsDiv);


    return card;
}