const TASKS = [
"The Untouchables 1987",
"The Goodfellas 1990",
"The Godfather 1972",
"The Godfather Part II 1974",
"The Godfather Part III 1990",
"American Gangster 2007",
"Casino 1995",
"The Irishman 2019",
"Scarface 1983",
"The Departed 2006",
"The Sopranos 1999–2007",
"Find Me Guilty 2006",
"Donnie Brasco 1997",
"Gotti 2018",
"A Bronx Tale 1993",
"Carlito's Way 1993",
"Once Upon a Time in America 1984",
"Heat 1995",
"Peaky Blinders 2013–2022",
"Boardwalk Empire 2010–2014",
"The Wire 2002–2008",
"Breaking Bad 2008–2013",
"Narcos 2015–2017",
"Narcos: Mexico 2018–2021",
"El Chapo 2017–2018",
"Pablo Escobar (multiple series, but notable ones: *Narcos* 2015, *Escobar: Paradise Lost* 2014)",
"Boardwalk Empire 2010–2014",
"Kingdom 2014–2017",
"Bad Blood 2017–2018",
"Fargo 1996 (film), 2014–2020 (TV series)",
"Sons of Anarchy 2008–2014",
"Ozark 2017–2022",
"Ray Donovan 2013–2020",
"The Shield 2002–2008",
"Shawshank Redemption 1994",
"Green Mile 1999",
"Saving Private Ryan 1998",
"Pulp Fiction 1994",
"The Usual Suspects 1995",
"Reservoir Dogs 1992",
];

let deletedTasks = [];
let undoTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const loadDefaultBtn = document.getElementById('loadDefaultBtn');
    const undoNotification = document.getElementById('undoNotification');
    const undoButton = document.getElementById('undoButton');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    const soundToggle = document.getElementById('soundToggle');
    const meowSound = new Audio('https://www.myinstants.com/media/sounds/m-e-o-w.mp3');
    let tasks = [];
    let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

    const loadTasks = () => {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            tasks = TASKS.map((text, index) => ({
                id: index + 1,
                text,
                completed: false
            }));
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
        renderTasks();
        updateStatistics();
    };

    const loadTheme = () => {
        const isDark = localStorage.getItem('darkTheme') === 'true';
        if (isDark) {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️ Tema Değiştir';
        }
    };

    const renderTasks = () => {
        taskList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-item-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${task.text}</span>
                </div>
                <button class="action-button delete" onclick="event.stopPropagation();">Sil</button>
            </div>
        `).join('');

        taskList.querySelectorAll('.task-item').forEach(item => {
            const checkbox = item.querySelector('input');
            const deleteBtn = item.querySelector('.delete');
            
            checkbox.addEventListener('change', () => {
                const taskId = parseInt(item.dataset.id);
                toggleTask(taskId);
            });

            deleteBtn.addEventListener('click', () => {
                const taskId = parseInt(item.dataset.id);
                deleteTask(taskId);
            });
        });
    };

    const toggleTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        const wasCompleted = task.completed;
        
        tasks = tasks.map(task => 
            task.id === taskId ? {...task, completed: !task.completed} : task
        );
        
        if (!wasCompleted) {
            playMeow();
        }
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateStatistics();
    };

    const updateStatistics = () => {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const remaining = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('remainingTasks').textContent = remaining;
    };

    const createDeleteModal = (message) => {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <p>${message}</p>
                    <div class="modal-buttons">
                        <button class="action-button clear-all" id="confirmDelete">Evet, Sil</button>
                        <button class="action-button add" id="cancelDelete">İptal</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = 'flex';

            const confirmBtn = modal.querySelector('#confirmDelete');
            const cancelBtn = modal.querySelector('#cancelDelete');

            confirmBtn.addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    };

    const showUndoNotification = () => {
        undoNotification.classList.add('show');
        if (undoTimer) {
            clearTimeout(undoTimer);
        }
        undoTimer = setTimeout(() => {
            hideUndoNotification();
            deletedTasks = [];
        }, 5000);
    };

    const hideUndoNotification = () => {
        undoNotification.classList.remove('show');
    };

    const loadDefaultTasks = async () => {
        if (tasks.length > 0) {
            const shouldLoad = await createDeleteModal(
                'Mevcut liste silinecek ve varsayılan liste yüklenecek. Onaylıyor musunuz?'
            );
            if (!shouldLoad) return;
        }
        
        tasks = TASKS.map((text, index) => ({
            id: index + 1,
            text,
            completed: false
        }));
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateStatistics();
    };

    const deleteTask = async (taskId) => {
        const shouldDelete = await createDeleteModal(
            'Bu filmi/diziyi silmek istediğinizden emin misiniz?'
        );
        
        if (shouldDelete) {
            const deletedTask = tasks.find(task => task.id === taskId);
            deletedTasks = [deletedTask];
            tasks = tasks.filter(task => task.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateStatistics();
            showUndoNotification();
        }
    };

    const clearCompleted = async () => {
        const completedCount = tasks.filter(task => task.completed).length;
        if (completedCount === 0) return;

        const shouldClear = await createDeleteModal(
            'Tamamlanan filmleri/dizileri silmek istediğinizden emin misiniz?'
        );
        
        if (shouldClear) {
            deletedTasks = tasks.filter(task => task.completed);
            tasks = tasks.filter(task => !task.completed);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateStatistics();
            showUndoNotification();
        }
    };

    const clearAll = async () => {
        if (tasks.length === 0) return;

        const shouldClear = await createDeleteModal(
            'Tüm filmleri/dizileri silmek istediğinizden emin misiniz?'
        );
        
        if (shouldClear) {
            deletedTasks = [...tasks];
            tasks = [];
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateStatistics();
            showUndoNotification();
        }
    };

    const undoDelete = () => {
        if (deletedTasks.length > 0) {
            if (undoTimer) {
                clearTimeout(undoTimer);
                undoTimer = null;
            }

            const restoredTasks = [...deletedTasks];
            tasks = [...tasks, ...restoredTasks].sort((a, b) => a.id - b.id);
            
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateStatistics();
            hideUndoNotification();
            deletedTasks = [];
        }
    };

    const checkScroll = () => {
        if (window.pageYOffset > 200) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const addTask = (text) => {
        if (text.trim() === '') return;
        
        const newTask = {
            id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
            text: text.trim(),
            completed: false
        };
        
        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateStatistics();
        newTaskInput.value = '';
    };

    const loadSoundPreference = () => {
        if (isSoundEnabled) {
            soundToggle.textContent = '🔊';
            soundToggle.classList.add('sound-on');
            soundToggle.classList.remove('sound-off');
        } else {
            soundToggle.textContent = '🔈';
            soundToggle.classList.add('sound-off');
            soundToggle.classList.remove('sound-on');
        }
    };

    const playMeow = () => {
        if (isSoundEnabled) {
            meowSound.currentTime = 0;
            meowSound.play().catch(error => console.log('Ses çalınamadı'));
        }
    };

    addTaskBtn.addEventListener('click', () => {
        addTask(newTaskInput.value);
    });

    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(newTaskInput.value);
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);
    loadDefaultBtn.addEventListener('click', loadDefaultTasks);
    undoButton.addEventListener('click', undoDelete);
    window.addEventListener('scroll', checkScroll);
    scrollToTopBtn.addEventListener('click', scrollToTop);
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDark);
        themeToggle.textContent = isDark ? '☀️ Tema Değiştir' : '🌙 Tema Değiştir';
    });

    soundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem('soundEnabled', isSoundEnabled);
        soundToggle.textContent = isSoundEnabled ? '🔊' : '🔈';
        if (isSoundEnabled) {
            soundToggle.classList.add('sound-on');
            soundToggle.classList.remove('sound-off');
        } else {
            soundToggle.classList.add('sound-off');
            soundToggle.classList.remove('sound-on');
        }
    });

    loadTheme();
    loadTasks();
    loadSoundPreference();
}); 