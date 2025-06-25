let taskList = [];
let taskIdCounter = 0;

const taskListContainer = document.querySelector(".task-list");
const addButton = document.querySelector(".add-task-button");
const closeButtons = document.querySelectorAll(".popup-close");
const filterApplyBtn = document.querySelector(".apply-btn");

const filterDateInput = document.querySelector("#filter-date");
const filterControl = document.querySelector(".filter-group");

const addTaskWindow = document.querySelector(".new-task-window");
const editTaskWindow = document.querySelector(".edit-task-window");
const filterWindow = document.querySelector(".task-filter-window");

const addTaskForm = document.querySelector(".add-new-task");
const editTaskForm = document.querySelector(".edit-task");

const sortSelect = document.querySelector("#sort-select");
const filterSelect = document.querySelector("#filter-window-select");

let currentSortCriteria = "date";
let currentFilterCriteria = "all";
let currentFilterDate = new Date().toISOString().slice(0, 10);

const CSS_CLASSES = {
    taskItem: "task-item",
    done: "done",
    hidden: "hidden"
};

const SVG_ICONS = {
    delete: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="m19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2-2h4a2,2 0,0,1,2,2v2" />
             </svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="14,2 18,6 7,17 3,17 3,13 14,2" />
                <line x1="3" y1="22" x2="21" y2="22" />
           </svg>`
};

document.addEventListener("DOMContentLoaded", async () => {
    localStorage.clear(); 
    await initializeList();
    renderTaskList();
    addTaskForm.addEventListener("submit", handleAddTask);
    editTaskForm.addEventListener("submit", handleEditTask);

    addButton.addEventListener("click", () => openPopup(addTaskWindow));
    closeButtons.forEach(btn => btn.addEventListener("click", closePopup));

    sortSelect.addEventListener("change", () => {
        currentSortCriteria = sortSelect.value;
        sortTaskList(currentSortCriteria);
    });

    filterDateInput.value = currentFilterDate;

    filterControl.addEventListener("click", () => {
        openPopup(filterWindow);
    });

    filterApplyBtn.addEventListener("click", () => {
        currentFilterCriteria = filterSelect.value.toLowerCase();
        currentFilterDate = filterDateInput.value;
        filterWindow.classList.add(CSS_CLASSES.hidden);
        applyFilters();

        filterSelect.querySelectorAll("option").forEach(option => {
            option.removeAttribute("selected");
        });
        filterSelect.querySelector(`option[value="${filterSelect.value}"]`).setAttribute("selected", true);
    });
});

async function initializeList() {
    const savedList = localStorage.getItem("taskList");
    if (savedList) {
        taskList = JSON.parse(savedList);
    } else {
        try {
            const response = await fetch("tasks.json");
            if (!response.ok) throw new Error("Fetch failed");
            taskList = await response.json();
        } catch (err) {
            console.error("Failed to load tasks:", err);
            taskList = [];
        }
    }
    taskIdCounter = taskList.length ? Math.max(...taskList.map(t => t.taskId)) : 0;
}

function renderTaskList() {
    taskListContainer.innerHTML = "";
    taskList.forEach(task => {
        taskListContainer.appendChild(createTaskCard(task));
    });
    sortTaskList(currentSortCriteria);
    applyFilters();
}

function saveList() {
    localStorage.setItem("taskList", JSON.stringify(taskList));
}

function createButton(className, html) {
    const button = document.createElement("button");
    button.className = className;
    button.innerHTML = html;
    return button;
}

function createSpan(className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
}

function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = CSS_CLASSES.taskItem;
    card.dataset.taskId = task.taskId;

    const taskStatus = document.createElement("input");
    taskStatus.type = "checkbox";
    taskStatus.className = "task-status";
    taskStatus.checked = task.done;

    const taskDetails = document.createElement("div");
    taskDetails.className = "task-details";
    taskDetails.append(
        createSpan("task-title", task.title),
        createSpan(`task-priority priority-${task.priority}`, task.priority)
    );

    const taskDate = document.createElement("div");
    taskDate.className = "task-date";
    taskDate.textContent = task.date;

    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";
    taskActions.append(
        createButton("edit-btn", SVG_ICONS.edit),
        createButton("delete-btn", SVG_ICONS.delete)
    );

    card.append(taskStatus, taskDetails, taskDate, taskActions);

    taskStatus.addEventListener("change", () => {
        task.done = taskStatus.checked;
        saveList();
        card.classList.toggle(CSS_CLASSES.done, task.done);
        reorderTaskCard(task);
    });

    taskActions.querySelector(".delete-btn").addEventListener("click", () => {
        taskList = taskList.filter(t => t.taskId !== task.taskId);
        saveList();
        removeTaskCard(task);
    });

    taskActions.querySelector(".edit-btn").addEventListener("click", () => {
        editTaskForm.dataset.editingId = task.taskId;
        openPopup(editTaskWindow);
        document.querySelector("#edit-task-name").value = task.title;
        document.querySelector("#edit-task-date").value = convertToISODate(task.date);
        document.querySelector(`.edit-task input[name="priority"][value="${task.priority}"]`).checked = true;
    });

    if (task.done) card.classList.add(CSS_CLASSES.done);

    return card;
}

function removeTaskCard(task) {
    const card = document.querySelector(`.task-item[data-task-id="${task.taskId}"]`);
    card?.remove();
}

function openPopup(popupElement) {
    popupElement.classList.remove(CSS_CLASSES.hidden);
}

function closePopup(event) {
    const popupToClose = event.target.closest(".new-task-window, .edit-task-window, .task-filter-window");
    if (popupToClose) {
        popupToClose.classList.add(CSS_CLASSES.hidden);
    }
}

function handleAddTask(event) {
    event.preventDefault();

    const title = document.querySelector("#task-name").value.trim();
    const dateRaw = document.querySelector("#task-date").value;
    const priority = document.querySelector("input[name='priority']:checked").value;

    if (!title || !dateRaw) return;

    const date = formatDateForStorage(dateRaw);

    const newTask = {
        title,
        priority,
        done: false,
        date,
        taskId: ++taskIdCounter
    };

    taskList.push(newTask);
    saveList();
    taskListContainer.prepend(createTaskCard(newTask));
    addTaskForm.reset();
    closePopup({ target: addTaskWindow.querySelector(".popup-close") });
    sortTaskList(currentSortCriteria);
}

function handleEditTask(event) {
    event.preventDefault();

    const taskId = Number(editTaskForm.dataset.editingId);
    const task = taskList.find(t => t.taskId === taskId);
    if (!task) return;

    const newTitle = document.querySelector("#edit-task-name").value.trim();
    const newDateRaw = document.querySelector("#edit-task-date").value;
    const newPriority = document.querySelector(".edit-task input[name='priority']:checked").value;

    if (!newTitle || !newDateRaw) return;

    const newDate = formatDateForStorage(newDateRaw);

    task.title = newTitle;
    task.date = newDate;
    task.priority = newPriority;

    saveList();

    const card = document.querySelector(`.task-item[data-task-id="${task.taskId}"]`);
    if (card) {
        updateTaskCardContent(card, task);
    }

    editTaskForm.reset();
    delete editTaskForm.dataset.editingId;
    closePopup({ target: editTaskWindow.querySelector(".popup-close") });
    sortTaskList(currentSortCriteria);
}

function reorderTaskCard(task) {
    const card = document.querySelector(`.task-item[data-task-id="${task.taskId}"]`);
    if (!card) return;

    taskListContainer.appendChild(card);
    if (!task.done) {
        sortTaskList(currentSortCriteria);
    }
}

function formatDateForStorage(dateRaw) {
    const date = new Date(dateRaw);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function convertToISODate(dateString) {
    const date = new Date(dateString);
    const tzOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function updateTaskCardContent(card, task) {
    card.querySelector(".task-title").textContent = task.title;
    const prioritySpan = card.querySelector(".task-priority");
    prioritySpan.textContent = task.priority;
    prioritySpan.className = `task-priority priority-${task.priority}`;
    card.querySelector(".task-date").textContent = task.date;
}

function sortTaskList(criteria) {
    const allCards = Array.from(taskListContainer.children);

    const doneCards = allCards.filter(card => card.classList.contains(CSS_CLASSES.done));
    const notDoneCards = allCards.filter(card => !card.classList.contains(CSS_CLASSES.done));

    notDoneCards.sort((a, b) => {
        const taskA = taskList.find(t => t.taskId === +a.dataset.taskId);
        const taskB = taskList.find(t => t.taskId === +b.dataset.taskId);

        if (!taskA || !taskB) return 0;

        if (criteria === "date") {
            const dateA = new Date(taskA.date);
            const dateB = new Date(taskB.date);
            return dateA - dateB;
        }

        if (criteria === "priority") {
            const priorityOrder = { low: 1, medium: 2, high: 3 };
            return (priorityOrder[taskB.priority] || 0) - (priorityOrder[taskA.priority] || 0);
        }

        return 0;
    });

    const fragment = document.createDocumentFragment();

    notDoneCards.forEach(card => fragment.appendChild(card));
    doneCards.forEach(card => fragment.appendChild(card));

    taskListContainer.innerHTML = "";
    taskListContainer.appendChild(fragment);
}

function applyFilters() {
    const allCards = Array.from(taskListContainer.children);
    const selectedDate = new Date(currentFilterDate);

    allCards.forEach(card => {
        const task = taskList.find(t => t.taskId === +card.dataset.taskId);
        if (!task) return;

        const taskDate = new Date(task.date);
        let shouldDisplay = true;

        if (currentFilterCriteria === "all") {
            shouldDisplay = true;
        } else if (currentFilterCriteria === "current") {
            shouldDisplay = isSameDay(taskDate, selectedDate);
        } else if (currentFilterCriteria === "past") {
            shouldDisplay = taskDate < selectedDate;
        } else if (currentFilterCriteria === "future") {
            shouldDisplay = taskDate > selectedDate;
        }

        card.classList.toggle(CSS_CLASSES.hidden, !shouldDisplay);
    });

    sortTaskList(currentSortCriteria);
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
