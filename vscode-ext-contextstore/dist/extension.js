/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/commands/createNote.ts":
/*!************************************!*\
  !*** ./src/commands/createNote.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createNote = createNote;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
async function createNote(context) {
    const noteContent = await vscode.window.showInputBox({
        prompt: 'Enter your note',
        placeHolder: 'Type your note here...'
    });
    if (noteContent) {
        // Get existing notes
        const notes = context.globalState.get('notes', []);
        // Add new note
        notes.push(noteContent);
        // Save back to storage
        await context.globalState.update('notes', notes);
        vscode.window.showInformationMessage(`Note saved! Total notes: ${notes.length}`);
    }
}


/***/ }),

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
const NotesViewProvider_1 = __webpack_require__(/*! ./providers/NotesViewProvider */ "./src/providers/NotesViewProvider.ts");
const createNote_1 = __webpack_require__(/*! ./commands/createNote */ "./src/commands/createNote.ts");
function activate(context) {
    console.log('🚀 ContextStore extension is now active!');
    // Register the webview provider
    const provider = new NotesViewProvider_1.NotesViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(NotesViewProvider_1.NotesViewProvider.viewType, provider));
    // Register the create note command
    context.subscriptions.push(vscode.commands.registerCommand('contextstore.createNote', () => {
        (0, createNote_1.createNote)(context);
    }));
    // Register a hello command for testing
    context.subscriptions.push(vscode.commands.registerCommand('contextstore.hello', () => {
        vscode.window.showInformationMessage('Hello from ContextStore! 👋');
    }));
}
function deactivate() {
    console.log('ContextStore extension deactivated');
}


/***/ }),

/***/ "./src/providers/NotesViewProvider.ts":
/*!********************************************!*\
  !*** ./src/providers/NotesViewProvider.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotesViewProvider = void 0;
class NotesViewProvider {
    _extensionUri;
    static viewType = 'contextstore.notesView';
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ContextStore</title>
      <style>
        body {
          padding: 20px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        h1 {
          margin-top: 0;
          color: var(--vscode-titleBar-activeForeground);
        }
        .input-container {
          margin: 20px 0;
        }
        input {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid var(--vscode-input-border);
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        input:focus {
          outline: 1px solid var(--vscode-focusBorder);
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
          margin-bottom: 20px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .note-card {
          background: var(--vscode-editor-inactiveSelectionBackground);
          padding: 12px;
          margin: 10px 0;
          border-radius: 6px;
          border-left: 3px solid var(--vscode-button-background);
        }
        .note-text {
          margin: 0;
          line-height: 1.5;
        }
        .empty-state {
          text-align: center;
          color: var(--vscode-descriptionForeground);
          padding: 40px 20px;
        }
        hr {
          border: none;
          border-top: 1px solid var(--vscode-panel-border);
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>📝 My Notes</h1>
      
      <div class="input-container">
        <input 
          type="text" 
          id="noteInput" 
          placeholder="Type your note here..." 
        />
        <button onclick="addNote()">Add Note</button>
      </div>
      
      <hr>
      
      <div id="notesList">
        <div class="empty-state">
          <p>No notes yet. Add your first note above! 📝</p>
        </div>
      </div>
      
      <script>
        let notes = [];
        
        function addNote() {
          const input = document.getElementById('noteInput');
          const noteText = input.value.trim();
          
          if (noteText !== '') {
            notes.push({
              text: noteText,
              id: Date.now(),
              timestamp: new Date().toLocaleString()
            });
            
            input.value = '';
            displayNotes();
          } else {
            alert('Please enter some text!');
          }
        }
        
        function displayNotes() {
          const list = document.getElementById('notesList');
          
          if (notes.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No notes yet. Add your first note above! 📝</p></div>';
            return;
          }
          
          list.innerHTML = '';
          
          for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-card';
            
            const noteText = document.createElement('p');
            noteText.className = 'note-text';
            noteText.textContent = note.text;
            
            noteDiv.appendChild(noteText);
            list.appendChild(noteDiv);
          }
        }
        
        document.getElementById('noteInput').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            addNote();
          }
        });
      </script>
    </body>
    </html>`;
    }
}
exports.NotesViewProvider = NotesViewProvider;


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("vscode");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map