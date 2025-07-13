var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
//data-------------------------------------------------------------
let wordData = [];
let fileHeader = [];
let dataHeader = [];
let filteredWordData = [];
let filterData;
let test;
//Initialize the IndexedDB database--------------------------------
let db;
const openDB = () => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open("fsdb", 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore("handles");
        };
        req.onsuccess = (e) => {
            const db = e.target.result;
            resolve(db);
        };
        req.onerror = (e) => {
            reject(e.target.error);
        };
    });
};
function savetoDB(key, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        db = db !== null && db !== void 0 ? db : (yield openDB());
        // FileSystemHandle（Directory/File）の場合
        if (data && typeof data === "object" && "requestPermission" in data && typeof data.requestPermission === "function") {
            const handle = data;
            const perm = yield ((_a = handle.queryPermission) === null || _a === void 0 ? void 0 : _a.call(handle, { mode: "readwrite" }));
            if (perm !== "granted") {
                const request = yield ((_b = handle.requestPermission) === null || _b === void 0 ? void 0 : _b.call(handle, { mode: "readwrite" }));
                if (request !== "granted") {
                    console.warn("Permission denied for handle");
                    return;
                }
            }
            const tx = db.transaction("handles", "readwrite");
            tx.objectStore("handles").put(handle, key);
            console.log(`Saved handle with key: ${key}`);
        }
        else {
            // 通常のオブジェクトなど
            const tx = db.transaction("handles", "readwrite");
            tx.objectStore("handles").put(data, key);
            console.log(`Saved plain data with key: ${key}`);
        }
    });
}
function loadfromDB(key) {
    return __awaiter(this, void 0, void 0, function* () {
        db = db !== null && db !== void 0 ? db : (yield openDB());
        const tx = db.transaction("handles", "readonly");
        const req = tx.objectStore("handles").get(key);
        // console.log(req);
        return new Promise((resolve) => {
            req.onsuccess = () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const data = req.result;
                if (!data)
                    return resolve(null);
                if (data && typeof data === "object" && "requestPermission" in data && typeof data.requestPermission === "function") {
                    const permission = yield ((_a = data.queryPermission) === null || _a === void 0 ? void 0 : _a.call(data, { mode: "readwrite" }));
                    if (permission === "granted") {
                        resolve(data);
                    }
                    else {
                        const request = yield ((_b = data.requestPermission) === null || _b === void 0 ? void 0 : _b.call(data, { mode: "readwrite" }));
                        resolve(request === "granted" ? data : null);
                    }
                }
                else {
                    // 通常のオブジェクトなど
                    resolve(data);
                }
            });
            req.onerror = () => resolve(null);
        });
    });
}
function debugListKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        db = db !== null && db !== void 0 ? db : (yield openDB());
        const tx = db.transaction("handles", "readonly");
        // const req = tx.objectStore("handles").getAll();
        const req = tx.objectStore("handles").getAllKeys();
        req.onsuccess = () => {
            console.log("保存されているキー一覧:", req.result);
        };
    });
}
//Keyboard---------------------------------------------------------
const Keyboard = {
    //https://qiita.com/NasuPanda/items/9c770496fe25ea0b25be#%E5%8F%82%E8%80%83
    elements: {
        main: null,
        keysContainer: null,
        keys: [],
    },
    eventHandlers: {
        oninput: null,
        onclose: null,
    },
    properties: {
        // キーボードの入力
        value: "",
        capsLock: false,
        shift: false,
    },
    init() {
        // main要素を作成
        this.elements.main = document.createElement("div");
        this.elements.keysContainer = document.createElement("div");
        // main要素をセットアップ
        this.elements.main.classList.add("keyboard", "keyboard--hidden");
        this.elements.keysContainer.classList.add("keyboard__keys");
        this.elements.keysContainer.appendChild(this._creatKeys());
        // keysにkeyElementを追加
        this.elements.keys = this.elements.keysContainer.querySelectorAll(".keyboard__key");
        // DOMの追加
        this.elements.main.appendChild(this.elements.keysContainer);
        document.body.appendChild(this.elements.main);
        // 特定のクラスを持つ要素では自動的にキーボードを使う
        // document.querySelectorAll(".use-keyboard-input").forEach((element) => {
        //   element.addEventListener("focus", () => {
        //     this.open(element.value, (currentValue) => {
        //       element.value = currentValue;
        //     });
        //   });
        // });
    },
    _creatKeys() {
        const fragment = document.createDocumentFragment();
        const keyLayout = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "shift", "z", "x", "c", "v", "b", "n", "m", "backspace", ",", "space", ".", "enter"];
        // Create HTML for an icon
        const createIconHTML = (icon_name) => {
            return `<i class="material-icons">${icon_name}</i>`;
        };
        keyLayout.forEach((key) => {
            const keyElement = document.createElement("button");
            const insertLineBreak = ["0", "p", "l", "backspace"].indexOf(key) !== -1;
            // 属性/クラスを追加
            keyElement.setAttribute("type", "button");
            // 全てのキーに必要なクラス
            keyElement.classList.add("keyboard__key");
            switch (key) {
                case "backspace":
                    keyElement.classList.add("keyboard__key--wide");
                    keyElement.innerHTML = createIconHTML("backspace");
                    keyElement.addEventListener("click", () => {
                        // this.properties.value = this.properties.value.substring(0, this.properties.value.length - 1);
                        this._triggerEvent("Backspace");
                    });
                    break;
                case "shift":
                    keyElement.classList.add("keyboard__key--wide", "keyboard__key--activatable");
                    keyElement.innerHTML = createIconHTML("keyboard_arrow_up");
                    keyElement.addEventListener("click", () => {
                        // console.log(this.properties.shift);
                        if (!this.properties.shift && !this.properties.capsLock) {
                            this.properties.shift = true;
                            keyElement.classList.add("keyboard__key--active");
                            this._toggleCapsLock();
                        }
                        else if (this.properties.shift) {
                            this.properties.shift = false;
                            this.properties.capsLock = true;
                            keyElement.innerHTML = createIconHTML("keyboard_capslock");
                        }
                        else {
                            this.properties.capsLock = false;
                            keyElement.innerHTML = createIconHTML("keyboard_arrow_up");
                            keyElement.classList.remove("keyboard__key--active");
                            this._toggleCapsLock();
                        }
                    });
                    break;
                case "enter":
                    keyElement.classList.add("keyboard__key--wide");
                    keyElement.innerHTML = createIconHTML("keyboard_return");
                    keyElement.addEventListener("click", () => {
                        // this.properties.value += "\n";
                        this._triggerEvent("Enter");
                    });
                    break;
                case "space":
                    keyElement.classList.add("keyboard__key--extra--wide");
                    keyElement.innerHTML = createIconHTML("space_bar");
                    keyElement.addEventListener("click", () => {
                        // this.properties.value += " ";
                        this._triggerEvent(" ");
                    });
                    break;
                // case "done":
                //   keyElement.classList.add("keyboard__key--wide", "keyboard__key--dark");
                //   keyElement.innerHTML = createIconHTML("check_circle");
                //   keyElement.addEventListener("click", () => {
                //     this.close();
                //     this._triggerEvent("onclose");
                //   });
                //   break;
                default:
                    keyElement.textContent = key.toLowerCase();
                    keyElement.addEventListener("click", () => {
                        // this.properties.value += this.properties.capsLock || this.properties.shift ? key.toUpperCase() : key.toLowerCase();
                        this._triggerEvent(this.properties.capsLock || this.properties.shift ? key.toUpperCase() : key.toLowerCase());
                        if (this.properties.shift) {
                            this.properties.shift = false;
                            this._toggleCapsLock();
                        }
                    });
                    break;
            }
            fragment.appendChild(keyElement);
            if (insertLineBreak) {
                fragment.appendChild(document.createElement("br"));
            }
        });
        return fragment;
    },
    /** valueをトリガーされたイベントに渡す */
    _triggerEvent(key) {
        var _a, _b;
        // console.log(`Triggering event: ${handlerName} with value: ${this.properties.value}`);
        // if (typeof this.eventHandlers[handlerName] == "function") {
        //   this.eventHandlers[handlerName](this.properties.value);
        // }
        if (!((_a = document.getElementById("test")) === null || _a === void 0 ? void 0 : _a.classList.contains("active")))
            return;
        // if (e.code === "Space" || e.code === "Tab") e.preventDefault(); // デフォルト動作を防ぐ
        if ((_b = document.getElementById("answerInput")) === null || _b === void 0 ? void 0 : _b.classList.contains("typeable")) {
            const label = document.getElementById("answerInput");
            if (key === "Enter") {
                checkAnswer();
                return;
            }
            if (key === "Backspace") {
                label.innerHTML = label.innerHTML.slice(0, -1);
                return;
            }
            if (key.length != 1)
                return;
            label.innerHTML += key;
            // console.log(`Key pressed: ${key}`);
        }
        else {
            if (key === "Enter") {
                nextProblem();
                return;
            }
        }
    },
    _toggleCapsLock() {
        for (const key of this.elements.keys) {
            if (key.childElementCount === 0) {
                key.textContent = this.properties.capsLock || this.properties.shift ? key.textContent.toUpperCase() : key.textContent.toLowerCase();
            }
        }
    },
    /** イベントハンドラ、キーボードの有効化 */
    open(initialValue, oninput, onclose) {
        // this.properties.value = initialValue || "";
        // this.eventHandlers.oninput = oninput;
        // this.eventHandlers.onclose = onclose;
        this.elements.main.classList.remove("keyboard--hidden");
    },
    /** イベントハンドラ、キーボードの無効化 */
    close() {
        // this.properties.value = "";
        // this.eventHandlers.oninput = oninput;
        // this.eventHandlers.onclose = onclose;
        this.elements.main.classList.add("keyboard--hidden");
    },
};
//Word Folder Selector---------------------------------------------
function selectWordDataFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        const handle = (yield window.showDirectoryPicker()); //ts-ignore
        if (!handle)
            return;
        yield savetoDB("wordDataFolder", handle);
        yield loadWordDataList();
    });
}
function loadWordDataList() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const dirHandle = (yield loadfromDB("wordDataFolder"));
        const wordFile = (yield loadfromDB("wordFile"));
        // console.log(dirHandle.entries());
        if (!dirHandle)
            return;
        const select = document.getElementById("wordData");
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        try {
            for (var _d = true, _e = __asyncValues(dirHandle.entries()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const [name, handle] = _c;
                //ignore error
                // console.log("Processing file:", handle);
                if (name.endsWith(".csv")) {
                    const file = yield handle.getFile();
                    const text = yield file.text();
                    const lines = text.split(/\r?\n/);
                    // console.log(lines);
                    if (lines.length >= 2) {
                        const format = lines[0].split(",")[1];
                        // console.log("Format:", format);
                        if (format.trim() === "1.0/W") {
                            const option = document.createElement("option");
                            option.value = name;
                            option.textContent = name;
                            select.appendChild(option);
                        }
                        if (name === wordFile) {
                            select.value = name;
                            // loadWordFile();
                        }
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield loadWordFile();
    });
}
//File Loader and Filter-------------------------------------------
function loadWordFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const select = document.getElementById("wordData");
        const p = document.getElementById("FileData");
        const selectedFileName = select === null || select === void 0 ? void 0 : select.value;
        p.textContent = "";
        console.log("選択されたファイル名:", selectedFileName);
        if (!selectedFileName)
            return;
        const dirHandle = (yield loadfromDB("wordDataFolder"));
        if (!dirHandle)
            return;
        try {
            const fileHandle = yield dirHandle.getFileHandle(selectedFileName);
            const file = yield fileHandle.getFile();
            const text = yield file.text();
            const lines = text.split(/\r?\n/);
            fileHeader = lines[0].split(",");
            dataHeader = lines[2].split(",");
            for (let i = 3; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line !== "") {
                    wordData[i - 3] = line.split(",");
                }
                else {
                    break; // 空行があればここで終了
                }
            }
            savetoDB("wordFile", file.name);
            p.innerHTML += `${fileHeader[3]}<br>`;
            p.innerHTML += `問題数: ${wordData.length}\n`;
            // console.log("Word data:", wordData);
            showFilterFields();
            filterWordData();
        }
        catch (e) {
            console.error("ファイル読み込みエラー:", e);
        }
    });
}
function showFilterFields() {
    const wordIdText = document.getElementById("wordIdText");
    wordIdText.innerHTML = `${dataHeader[1]}`;
}
function filterWordData() {
    saveFilter();
    const from = filterData.wordFrom;
    const to = filterData.wordTo;
    const p = document.getElementById("filteredData");
    const startButton = document.getElementById("start");
    p.innerHTML = "";
    filteredWordData = [];
    wordData.forEach((data) => {
        if (from <= parseInt(data[1], 10) && parseInt(data[1], 10) <= to) {
            filteredWordData.push(data);
        }
    });
    p.innerHTML += `該当問題数: ${filteredWordData.length}<br>`;
    if (filteredWordData.length > 0) {
        startButton.disabled = false;
    }
    else {
        startButton.disabled = true;
    }
}
function saveFilter() {
    return __awaiter(this, void 0, void 0, function* () {
        const wordFrom = parseInt(document.getElementById("wordFrom").value, 10);
        const wordTo = parseInt(document.getElementById("wordTo").value, 10);
        const random = document.getElementById("random").checked;
        const initials = document.getElementById("initials").checked;
        filterData = { wordFrom, wordTo, random, initials };
        yield savetoDB("filterData", filterData);
        console.log("Filter data saved:", filterData);
    });
}
function loadFilter() {
    return __awaiter(this, void 0, void 0, function* () {
        filterData = (yield loadfromDB("filterData"));
        // console.log(filterData);
        if (filterData) {
            document.getElementById("wordFrom").value = filterData.wordFrom.toString();
            document.getElementById("wordTo").value = filterData.wordTo.toString();
            document.getElementById("random").checked = filterData.random;
            document.getElementById("initials").checked = filterData.initials;
            console.log("Filter data loaded:", filterData);
        }
        else {
            console.log("No filter data found, using defaults.");
        }
    });
}
//Runner-----------------------------------------------------------
function startTest() {
    const testPage = document.getElementById("test");
    const rootPage = document.getElementById("root");
    rootPage.classList.remove("active");
    testPage.classList.add("active");
    Keyboard.open("", {}, {});
    const testTitle = document.getElementById("testTitle");
    testTitle.innerHTML = fileHeader[3];
    const testDescription = document.getElementById("testDescription");
    testDescription.innerHTML = `${filterData.wordFrom}～${filterData.wordTo}<br>${filterData.random ? "+RANDOM" : ""}<br>${filterData.initials ? "+INITIALS" : ""}`;
    const answerInput = document.getElementById("answerInput");
    answerInput.classList.add("typeable");
    test = {
        testSize: filteredWordData.length,
        round: 1,
        roundSize: filteredWordData.length,
        answer: "",
        current: 0,
        currentPoolIndex: -1,
        correctCount: 0,
        incorrectCount: 0,
        pool: [...filteredWordData],
        status: [],
    };
    nextProblem();
}
function nextRound() {
    endTest(); //今後2週目が必要になったら書く
}
function nextProblem() {
    if (test.pool.length === 0) {
        nextRound();
        return;
    }
    const testProgress = document.getElementById("testProgress");
    const testQuestion = document.getElementById("testQuestion");
    const answerInput = document.getElementById("answerInput");
    test.current++;
    testProgress.innerHTML = `${test.current}/${test.roundSize}`;
    if (filterData.random) {
        test.currentPoolIndex = Math.floor(Math.random() * test.pool.length);
    }
    else {
        test.currentPoolIndex = 0;
    }
    let q1 = test.pool[test.currentPoolIndex][3];
    test.answer = q1.match(/\*\*(.+?)\*\*/)[0].replace(/\*\*/g, "");
    q1 = q1.replace(/\*\*(.+?)\*\*/g, (_match, p1) => {
        if (filterData.initials) {
            // 頭文字を表示する場合
            return p1.length > 0 ? `<span style="color: red;">( ${p1[0]}    )</span>` : "";
        }
        else {
            // 頭文字を表示しない場合
            return `<span style="color: red;">(     )</span>`;
        }
    }); //- **text**が問題
    q1 = q1.replace(/\*(.+?)\*/g, (_match, p1) => {
        return p1.length > 0 ? `${p1}` : "";
    }); //- *text*はサブ問題(前置詞など)
    let q2 = test.pool[test.currentPoolIndex][4];
    q2 = q2.replace(/\*\*(.+?)\*\*/g, (_match, p1) => {
        return p1.length > 0 ? `<span style="color: red;">${p1}</span>` : "";
    });
    testQuestion.innerHTML = `${q1}<br>${q2}`; // 問題文は3列目
    answerInput.innerHTML = "";
    answerInput.classList.add("typeable");
}
function checkAnswer() {
    const answerInput = document.getElementById("answerInput");
    answerInput.classList.remove("typeable");
    // console.log(test.answer);
    if (answerInput.textContent.trim() === test.answer.trim()) {
        answerInput.innerHTML = `<span class="correct" style="color: green;">${answerInput.innerHTML}</span>`;
        test.correctCount++;
        test.status[test.current - 1] = {
            answers: [answerInput.textContent.trim()],
            judges: [1],
        };
    }
    else {
        answerInput.innerHTML = `${answerInput.innerHTML}<br><span class="incorrect" style="color: red;">${test.answer}</span>`;
        test.incorrectCount++;
        test.status[test.current - 1] = {
            answers: [answerInput.textContent.trim()],
            judges: [0],
        };
    }
    test.pool.splice(test.currentPoolIndex, 1);
    // console.log(filteredWordData);
    // console.log(test.pool);
}
function endTest() {
    const testPage = document.getElementById("test");
    const resultPage = document.getElementById("result");
    testPage.classList.remove("active");
    resultPage.classList.add("active");
    const resultTitle = document.getElementById("resultTitle");
    const resultDescription = document.getElementById("resultDescription");
    const resultStatus = document.getElementById("resultStatus");
    resultTitle.innerHTML = document.getElementById("testTitle").innerHTML;
    resultDescription.innerHTML = document.getElementById("testDescription").innerHTML;
    resultStatus.innerHTML = `正解数: ${test.correctCount} / ${test.roundSize}<br>不正解数: ${test.incorrectCount}`;
    Keyboard.close();
}
function backToRoot() {
    const resultPage = document.getElementById("result");
    const rootPage = document.getElementById("root");
    resultPage.classList.remove("active");
    rootPage.classList.add("active");
}
//-----------------------------------------------------------------
window.onload = () => __awaiter(this, void 0, void 0, function* () {
    yield debugListKeys();
    yield loadFilter();
    yield loadWordDataList();
    document.body.addEventListener("keydown", (e) => {
        var _a, _b;
        if (!((_a = document.getElementById("test")) === null || _a === void 0 ? void 0 : _a.classList.contains("active")))
            return;
        if (e.code === "Space" || e.code === "Tab")
            e.preventDefault(); // デフォルト動作を防ぐ
        if ((_b = document.getElementById("answerInput")) === null || _b === void 0 ? void 0 : _b.classList.contains("typeable")) {
            const label = document.getElementById("answerInput");
            if (e.code === "Enter") {
                checkAnswer();
                return;
            }
            if (e.key === "Backspace") {
                label.innerHTML = label.innerHTML.slice(0, -1);
                return;
            }
            if (e.key.length != 1)
                return;
            if (e.shiftKey) {
                label.innerHTML += e.key.toUpperCase();
            }
            else {
                label.innerHTML += e.key;
            }
        }
        else {
            if (e.code === "Enter") {
                nextProblem();
                return;
            }
        }
    });
    Keyboard.init();
    // startTest();
});
