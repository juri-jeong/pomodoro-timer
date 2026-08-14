const taskNameInput = document.getElementById("taskName");
const taskMinutesInput = document.getElementById("taskMinutes");
const taskSessionsInput = document.getElementById("taskSessions");
const addTaskButton = document.getElementById("addTaskButton");

const taskList = document.getElementById("taskList");
const timerDisplay = document.getElementById("timerDisplay");
const totalFocusTime = document.getElementById("totalFocusTime");
const completedSessions = document.getElementById("completedSessions");
const sessionGoal = document.getElementById("sessionGoal");
const progressFill = document.getElementById("progressFill");

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const workModeButton = document.getElementById("workModeButton");
const breakModeButton = document.getElementById("breakModeButton");
const finishSound = new Audio("iced_coffee_2.mp3");

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}
let tasks = JSON.parse(localStorage.getItem("tasks")) || [
  {
    id: 1,
    name: "GRP1 Condition Test",
    minutes: 25,
    goalSessions: 4,
    completedSessions: 0,
    status: "In Progress"
  },
  {
    id: 2,
    name: "Result Verification",
    minutes: 20,
    goalSessions: 3,
    completedSessions: 0,
    status: "Not Started"
  },
  {
    id: 3,
    name: "Bug Reproduction",
    minutes: 30,
    goalSessions: 5,
    completedSessions: 0,
    status: "Not Started"
  }
];

function saveTasks() {
  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );
}

let selectedTaskId = tasks.length > 0 ? tasks[0].id : null;
let timerSeconds = tasks.length > 0 ? tasks[0].minutes * 60 : 25 * 60;
let timerInterval = null;
let endTime = null;
let isBreakMode = false;
let totalFocusMinutes = 0;
let totalCompletedSessions = 0;

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = task.id === selectedTaskId ? "task-card active" : "task-card";

    card.innerHTML = `
      <div class="task-icon"><img src="bean.png" alt="bean"></div>
      <div>
        <div class="task-title ${containsJapanese(task.name) ? "jp-text" : ""}">
  ${task.name}
        </div>
        <div class="task-meta">
          ⏱ ${task.minutes} min &nbsp; | &nbsp;
          ${task.completedSessions} / ${task.goalSessions} sessions &nbsp; | &nbsp;
          ${task.status}
        </div>
      </div>
      <div class="task-actions">
        <button class="small-button" onclick="selectTask(${task.id})">Select</button>
        <button class="small-button" onclick="completeSession(${task.id})">Done</button>
        <button class="small-button" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    taskList.appendChild(card);
  });

  updateSummary();
}

function addTask() {
  const name = taskNameInput.value.trim();
  const minutes = Number(taskMinutesInput.value);
  const goalSessions = Number(taskSessionsInput.value);

  if (!name || minutes <= 0 || goalSessions <= 0) {
    alert("Please enter a task name, minutes, and session goal.");
    return;
  }

  const newTask = {
    id: Date.now(),
    name,
    minutes,
    goalSessions,
    completedSessions: 0,
    status: "Not Started"
  };

tasks.push(newTask);
saveTasks();

taskNameInput.value = "";
taskMinutesInput.value = 25;
taskSessionsInput.value = 4;

renderTasks();
}

function selectTask(taskId) {
  selectedTaskId = taskId;
  const task = getSelectedTask();

  if (!task) return;

  task.status = "In Progress";
  isBreakMode = false;
  saveTasks();
  timerSeconds = task.minutes * 60;
  stopTimer();
  updateTimerDisplay();
  updateModeButtons();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);

if (selectedTaskId === taskId && tasks.length > 0) {
  selectedTaskId = tasks[0].id;
  timerSeconds = tasks[0].minutes * 60;
}

if (tasks.length === 0) {
  selectedTaskId = null;
  timerSeconds = 25 * 60;
}

saveTasks();

renderTasks();
updateTimerDisplay();
}

function completeSession(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  task.completedSessions += 1;
  task.status = task.completedSessions >= task.goalSessions ? "Completed" : "In Progress";

totalCompletedSessions += 1;
totalFocusMinutes += task.minutes;

saveTasks();

updateSummary();
renderTasks();
}

function startTimer() {

  if (timerInterval) return;

  endTime = Date.now() + timerSeconds * 1000;

  timerInterval = setInterval(() => {

    timerSeconds = Math.max(
      0,
      Math.floor((endTime - Date.now()) / 1000)
    );

    updateTimerDisplay();

    if (timerSeconds <= 0) {

      finishSound.play();

      stopTimer();

      if (!isBreakMode) {

        completeSession(selectedTaskId);

        showToast("☕ Work session completed! Time for a break.");

      } else {

        alert("Break finished! Ready to focus again?");

      }
    }

  }, 250);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();

  endTime = null;

  const breakMinutes =
    Number(document.getElementById("breakMinutes").value);

  if (isBreakMode) {
    timerSeconds = breakMinutes * 60;
  } else {
    const task = getSelectedTask();
    timerSeconds = task ? task.minutes * 60 : 25 * 60;
  }

  updateTimerDisplay();
}

function setWorkMode() {
  isBreakMode = false;
  const task = getSelectedTask();
  timerSeconds = task ? task.minutes * 60 : 25 * 60;
  stopTimer();
  updateModeButtons();
  updateTimerDisplay();
}

function setBreakMode() {
  isBreakMode = true;

  const breakMinutes =
    Number(document.getElementById("breakMinutes").value);

  timerSeconds = breakMinutes * 60;

  stopTimer();
  updateModeButtons();
  updateTimerDisplay();
}

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateSummary() {
  const hours = Math.floor(totalFocusMinutes / 60);
  const minutes = totalFocusMinutes % 60;

  totalFocusTime.textContent = `${hours}h ${String(minutes).padStart(2, "0")}m`;
  completedSessions.textContent = totalCompletedSessions;

  const selectedTask = getSelectedTask();

  if (selectedTask) {
    sessionGoal.textContent = `${selectedTask.completedSessions} / ${selectedTask.goalSessions} sessions`;

    const progress = Math.min(
      (selectedTask.completedSessions / selectedTask.goalSessions) * 100,
      100
    );

    progressFill.style.width = `${progress}%`;
  }
}

function updateModeButtons() {
  workModeButton.classList.toggle("active", !isBreakMode);
  breakModeButton.classList.toggle("active", isBreakMode);
}

addTaskButton.addEventListener("click", addTask);
startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);
workModeButton.addEventListener("click", setWorkMode);
breakModeButton.addEventListener("click", setBreakMode);
taskNameInput.addEventListener("input", () => {
  if (containsJapanese(taskNameInput.value)) {
    taskNameInput.classList.add("jp-text");
  } else {
    taskNameInput.classList.remove("jp-text");
  }
});

renderTasks();
updateTimerDisplay();
updateModeButtons();