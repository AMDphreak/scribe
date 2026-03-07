/**
 * Onboarding window: install GitHub CLI and Git via winget, then run gh auth login.
 * Workaround: streams command output using a thread + timer + LogWidget
 * (no ProcessOutputWidget dependency until dlangui PR is merged).
 */
module syndrome.onboarding;

import dlangui;
import dlangui.widgets.editors;
import dlangui.widgets.layouts;
import dlangui.widgets.controls;
import dlangui.dialogs.dialog;
import dlangui.core.stdaction;
import dlangui.platforms.common.platform;
import std.conv : to;
import std.utf : toUTF32;
import core.thread : Thread;
import core.sync.mutex : Mutex;
import std.process : pipeProcess, wait, Redirect;
import std.stdio : readln;
import std.string : strip;

/// Show onboarding when tools are missing. Returns true if user clicked Done (or closed), false if aborted.
bool runOnboarding(Window parentWindow) {
	auto dialog = new OnboardingDialog(UIString.fromRaw("Set up Syndrome"d), parentWindow);
	dialog.show();
	return dialog.completed;
}

/// Dialog with log area and buttons to install gh, git, and run gh auth login.
class OnboardingDialog : Dialog {
	LogWidget _log;
	Mutex _outputMutex;
	string[] _pendingLines;
	bool _processDone;
	ulong _timerId;
	bool _completed;
	enum POLL_MS = 150;

	this(UIString caption, Window parentWindow) {
		super(caption, parentWindow, DialogFlag.Modal | DialogFlag.Resizable, 700, 500);
		_completed = false;
	}

	override void initialize() {
		TextWidget hint = new TextWidget("hint");
		hint.text = "Syndrome needs GitHub CLI and Git. Click the buttons below to install them (Windows: winget). Then log in to GitHub. After installing, restart Syndrome so the new tools are found."d;
		hint.layoutWidth = FILL_PARENT;
		addChild(hint);

		LinearLayout btnRow = new HorizontalLayout();
		btnRow.layoutWidth = FILL_PARENT;
		Button installGh = new Button("install_gh");
		installGh.text = "1. Install GitHub CLI"d;
		installGh.click = delegate(Widget w) { runWinget("GitHub.cli"); return true; };
		Button installGit = new Button("install_git");
		installGit.text = "2. Install Git"d;
		installGit.click = delegate(Widget w) { runWinget("Git.Git"); return true; };
		Button authLogin = new Button("auth_login");
		authLogin.text = "3. Log in to GitHub"d;
		authLogin.click = delegate(Widget w) { runGhAuthLogin(); return true; };
		btnRow.addChild(installGh);
		btnRow.addChild(installGit);
		btnRow.addChild(authLogin);
		addChild(btnRow);

		_log = new LogWidget("log");
		_log.layoutWidth = FILL_PARENT;
		_log.layoutHeight = FILL_PARENT;
		_log.readOnly = true;
		_log.scrollLock = true;
		_log.maxLines = 2000;
		addChild(_log);

		addChild(createButtonsPanel([ACTION_OK], 0, 0));
	}

	@property bool completed() { return _completed; }

	void appendLine(string line) {
		if (line.length > 0)
			_log.appendText(toUTF32(line ~ "\n"));
	}

	void runWinget(string id) {
		// winget install --id ID --accept-package-agreements --accept-source-agreements
		appendLine("$ winget install --id " ~ id ~ " --accept-package-agreements --accept-source-agreements");
		startCommand(["winget", "install", "--id", id, "--accept-package-agreements", "--accept-source-agreements"]);
	}

	void runGhAuthLogin() {
		appendLine("$ gh auth login (opens browser)");
		startCommand(["gh", "auth", "login", "--web", "--git-protocol", "https"]);
	}

	private void startCommand(string[] args) {
		if (args.length == 0) return;
		if (_timerId != 0) {
			appendLine("(wait for current command to finish)");
			return;
		}
		_processDone = false;
		_timerId = setTimer(POLL_MS);
		auto argsCopy = args.dup;
		auto th = new Thread(() {
			runProcessAndStream(argsCopy);
		});
		th.start();
	}

	private void runProcessAndStream(string[] args) {
		try {
			auto proc = pipeProcess(args, Redirect.stdout | Redirect.stderr);
			for (;;) {
				auto line = proc.stdout.readln();
				if (line.length == 0) break;
				_outputMutex.lock();
				_pendingLines ~= line.idup.to!string.strip;
				_outputMutex.unlock();
			}
			for (;;) {
				auto line = proc.stderr.readln();
				if (line.length == 0) break;
				_outputMutex.lock();
				_pendingLines ~= line.idup.to!string.strip;
				_outputMutex.unlock();
			}
			wait(proc.pid);
		} catch (Exception e) {
			_outputMutex.lock();
			_pendingLines ~= "Error: " ~ e.msg;
			_outputMutex.unlock();
		}
		_outputMutex.lock();
		_processDone = true;
		_outputMutex.unlock();
	}

	override bool onTimer(ulong id) {
		if (id != _timerId) return false;
		_outputMutex.lock();
		foreach (line; _pendingLines)
			appendLine(line);
		_pendingLines.length = 0;
		bool done = _processDone;
		_outputMutex.unlock();
		if (done) {
			cancelTimer(_timerId);
			_timerId = 0;
			return false;
		}
		return true;
	}

	override bool handleAction(const Action action) {
		if (action.id == StandardAction.Ok) {
			_completed = true;
			close(action);
			return true;
		}
		return super.handleAction(action);
	}
}
