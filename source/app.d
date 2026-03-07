/**
 * Syndrome — Edit Markdown/AsciiDoc in GitHub static site repos.
 * For non-technical users; supports major static site generators.
 * Named for "Markdown Syndrome" and for the Down Syndrome non-profit (Memphis, TN).
 */
module app;

import dlangui;
import dlangui.widgets.tree;
import dlangui.dialogs.msgbox;
import std.conv : to;
import std.utf : toUTF32;
import std.file : readText, write, exists, isFile;
import std.path : pathSeparator;

import syndrome.ssg_detect;
import syndrome.github_client;
import syndrome.onboarding;

mixin APP_ENTRY_POINT;

// Action IDs
enum SyndromeActions : int {
	FileOpenRepo = 10100,
	FileSave = 10103,
	FileCommit = 10104, // "Commit" = push to GitHub (save is local write)
	FileExit = 10101,
	HelpSetupTools = 10105,
	HelpAbout = 10102,
}

/// Populate a TreeWidget from SsgNode[] (recursive).
void fillTree(TreeItem parent, const SsgNode[] nodes, string repoRoot) {
	foreach (n; nodes) {
		string id = n.path;
		dstring label = toUTF32(n.displayName);
		string icon = n.isContent ? "document-open" : "document-properties";
		TreeItem item = parent.newChild(id, label, icon);
		fillTree(item, n.children, repoRoot);
	}
}

/// Main application frame: URL input, content/other trees, editor, preview.
class SyndromeFrame : VerticalLayout {
	EditLine _urlEdit;
	Button _openBtn;
	TextWidget _statusWidget;
	TextWidget _homepageHint;
	TreeWidget _contentTree;
	TreeWidget _otherTree;
	EditBox _editor;
	EditBox _preview;
	string _repoRoot;
	string _currentFilePath;
	GhRepo _ghRepo; // set when repo is opened, for push
	SsgScan _scan;
	ResizerWidget _resizer1;
	ResizerWidget _resizer2;

	this(string ID) {
		super(ID);
		layoutWidth = FILL_PARENT;
		layoutHeight = FILL_PARENT;

		// Top: URL + Open
		LinearLayout topBar = new HorizontalLayout();
		topBar.layoutWidth = FILL_PARENT;
		_urlEdit = new EditLine("url");
		_urlEdit.layoutWidth = FILL_PARENT;
		_openBtn = new Button("open");
		_openBtn.text = "Open repo"d;
		_openBtn.click = delegate(Widget w) { onOpenRepo(w); return true; };
		Button saveBtn = new Button("save");
		saveBtn.text = "Save"d;
		saveBtn.click = delegate(Widget w) { onSave(w); return true; };
		Button commitBtn = new Button("commit");
		commitBtn.text = "Commit"d;
		commitBtn.click = delegate(Widget w) { onCommit(w); return true; };
		topBar.addChild(_urlEdit);
		topBar.addChild(_openBtn);
		topBar.addChild(saveBtn);
		topBar.addChild(commitBtn);
		addChild(topBar);

		_statusWidget = new TextWidget("status");
		_statusWidget.text = "Paste a repo URL and click Open. Use Help → Set up tools if you need to install GitHub CLI or log in."d;
		addChild(_statusWidget);

		_homepageHint = new TextWidget("homepage");
		_homepageHint.text = ""d;
		addChild(_homepageHint);

		// Main area: trees | editor | preview
		LinearLayout mainRow = new HorizontalLayout();
		mainRow.layoutWidth = FILL_PARENT;
		mainRow.layoutHeight = FILL_PARENT;

		// Left: Content tree (and optionally other tree in same panel or tab)
		LinearLayout treePanel = new VerticalLayout();
		treePanel.layoutWidth = WRAP_CONTENT;
		treePanel.layoutHeight = FILL_PARENT;
		_contentTree = new TreeWidget("content_tree");
		_contentTree.layoutWidth = WRAP_CONTENT;
		_contentTree.layoutHeight = FILL_PARENT;
		_otherTree = new TreeWidget("other_tree");
		_otherTree.layoutWidth = WRAP_CONTENT;
		_otherTree.layoutHeight = WRAP_CONTENT;
		TextWidget contentLabel = new TextWidget("content_label");
		contentLabel.text = "Content (editable)"d;
		treePanel.addChild(contentLabel);
		treePanel.addChild(_contentTree);
		TextWidget otherLabel = new TextWidget("other_label");
		otherLabel.text = "Other files"d;
		treePanel.addChild(otherLabel);
		treePanel.addChild(_otherTree);
		mainRow.addChild(treePanel);
		_resizer1 = new ResizerWidget();
		mainRow.addChild(_resizer1);

		LinearLayout editPreview = new VerticalLayout();
		editPreview.layoutWidth = FILL_PARENT;
		editPreview.layoutHeight = FILL_PARENT;
		_editor = new EditBox("editor");
		_editor.layoutWidth = FILL_PARENT;
		_editor.layoutHeight = FILL_PARENT;
		_preview = new EditBox("preview");
		_preview.layoutWidth = FILL_PARENT;
		_preview.layoutHeight = FILL_PARENT;
		_preview.readOnly = true;
		editPreview.addChild(_editor);
		_resizer2 = new ResizerWidget();
		editPreview.addChild(_resizer2);
		editPreview.addChild(_preview);
		mainRow.addChild(editPreview);

		addChild(mainRow);

		_contentTree.selectionChange = delegate(TreeItems source, TreeItem selectedItem, bool activated) {
			onContentTreeSelect(source, selectedItem, activated);
		};
	}

	void onOpenRepo(Widget) {
		string url = to!string(_urlEdit.text);
		if (url.length == 0) {
			window.showMessageBox("Syndrome"d, "Enter a GitHub repository URL."d);
			return;
		}
		GhRepo repo = parseRepoUrl(url);
		if (!repo.valid) {
			window.showMessageBox("Syndrome"d, "Could not parse URL. Use owner/repo or https://github.com/owner/repo"d);
			return;
		}
		string username;
		AuthStatus auth = checkGhAuth(username);
		if (auth == AuthStatus.noGhCli) {
			window.showMessageBox("Syndrome"d, "GitHub CLI (gh) not found. Install it from https://cli.github.com and run: gh auth login"d);
			return;
		}
		if (auth == AuthStatus.notAuthenticated) {
			window.showMessageBox("Syndrome"d, "Not logged in to GitHub. Run in terminal: gh auth login"d);
			return;
		}
		_statusWidget.text = "Cloning "d ~ toUTF32(repo.owner ~ "/" ~ repo.repo) ~ "..."d;
		string cloneDir = appDataPath("syndrome") ~ pathSeparator ~ "repos";
		string localPath;
		if (!cloneRepo(repo, cloneDir, localPath)) {
			window.showMessageBox("Syndrome"d, "Clone failed. Check permissions and try again."d);
			_statusWidget.text = "Clone failed."d;
			return;
		}
		_repoRoot = localPath;
		_ghRepo = repo;
		_scan = scanRepo(_repoRoot);
		_statusWidget.text = "Detected: "d ~ toUTF32(ssgKindName(_scan.kind)) ~ ". Loading tree..."d;

		// Repo metadata
		string desc, homepage;
		getRepoMeta(repo, desc, homepage);
		if (homepage.length > 0 || desc.length > 0) {
			dstring hint = "Repo: "d;
			if (homepage.length) hint ~= toUTF32(homepage);
			if (desc.length) hint ~= " — "d ~ toUTF32(desc);
			_homepageHint.text = hint;
		} else {
			_homepageHint.text = ""d;
		}

		// Clear and fill trees
		_contentTree.clearAllItems();
		_otherTree.clearAllItems();
		TreeItem contentRoot = _contentTree.items.newChild("content_root", "Content"d, "document-open");
		TreeItem otherRoot = _otherTree.items.newChild("other_root", "Other"d, "document-properties");
		fillTree(contentRoot, _scan.contentTree, _repoRoot);
		fillTree(otherRoot, _scan.otherTree, _repoRoot);
		_contentTree.items.selectItem(contentRoot);
		_statusWidget.text = "Ready. Select a file to edit. Save = write locally; Commit = push to GitHub."d;
	}

	void onSave(Widget) {
		if (_currentFilePath.length == 0) {
			window.showMessageBox("Syndrome"d, "Open a file first."d);
			return;
		}
		try {
			import std.utf : toUTF8;
			write(_currentFilePath, toUTF8(_editor.text));
			_statusWidget.text = "Saved."d;
		} catch (Exception e) {
			window.showMessageBox("Syndrome"d, "Could not save: "d ~ toUTF32(e.msg));
		}
	}

	void onCommit(Widget) {
		if (_repoRoot.length == 0 || !_ghRepo.valid) {
			window.showMessageBox("Syndrome"d, "Open a repo first."d);
			return;
		}
		_statusWidget.text = "Committing and pushing..."d;
		bool ok = commitAndPush(_repoRoot, "Update content from Syndrome");
		if (ok) {
			_statusWidget.text = "Pushed to GitHub."d;
		} else {
			window.showMessageBox("Syndrome"d, "Commit or push failed. Check git/gh and try again."d);
			_statusWidget.text = "Commit failed."d;
		}
	}

	void onContentTreeSelect(TreeItems source, TreeItem selectedItem, bool activated) {
		if (!selectedItem || _repoRoot.length == 0) return;
		string path = selectedItem.id;
		if (path == "content_root") return;
		import std.string : replace;
		string fullPath = _repoRoot ~ pathSeparator ~ replace(path, "/", pathSeparator);
		if (!exists(fullPath)) return;
		if (!isFile(fullPath)) return;
		try {
			_editor.text = toUTF32(readText(fullPath));
			_currentFilePath = fullPath;
			// Simple preview: for MD just show raw for now; could add markdown renderer later
			_preview.text = _editor.text;
		} catch (Exception e) {
			window.showMessageBox("Syndrome"d, "Could not read file: "d ~ toUTF32(e.msg));
		}
	}

	string ssgKindName(SsgKind k) {
		switch (k) {
			case SsgKind.hugo: return "Hugo";
			case SsgKind.jekyll: return "Jekyll";
			case SsgKind.mkdocs: return "MkDocs";
			case SsgKind.docusaurus: return "Docusaurus";
			case SsgKind.astro: return "Astro";
			case SsgKind.starlight: return "Starlight";
			case SsgKind.antora: return "Antora";
			case SsgKind.vitepress: return "VitePress";
			case SsgKind.eleventy: return "Eleventy";
			case SsgKind.nextStatic: return "Next.js";
			case SsgKind.mdxOnly: return "MD/MDX";
			default: return "Unknown";
		}
	}
}

extern (C) int UIAppMain(string[] args) {
	Platform.instance.uiLanguage = "en";
	Platform.instance.uiTheme = "theme_default";
	FontManager.subpixelRenderingMode = SubpixelRenderingMode.None;

	Window window = Platform.instance.createWindow("Syndrome — Edit static site content", null, WindowFlag.Resizable | WindowFlag.ExpandSize, 1000, 700);

	VerticalLayout content = new VerticalLayout();
	content.layoutWidth = FILL_PARENT;
	content.layoutHeight = FILL_PARENT;

	// Simple menu
	MenuItem mainMenuItems = new MenuItem();
	MenuItem fileItem = new MenuItem(new Action(1, "File"d));
	fileItem.add(new Action(SyndromeActions.FileOpenRepo, "Open repo..."d, "document-open", KeyCode.KEY_O, KeyFlag.Control));
	fileItem.add(new Action(SyndromeActions.FileSave, "Save"d, "document-save", KeyCode.KEY_S, KeyFlag.Control));
	fileItem.add(new Action(SyndromeActions.FileCommit, "Commit (push to GitHub)"d, "document-save-as"));
	fileItem.add(new Action(SyndromeActions.FileExit, "Exit"d, "document-close", KeyCode.KEY_X, KeyFlag.Alt));
	MenuItem helpItem = new MenuItem(new Action(4, "Help"d));
	helpItem.add(new Action(SyndromeActions.HelpSetupTools, "Set up tools (install gh, Git, log in)"d));
	helpItem.add(new Action(SyndromeActions.HelpAbout, "About Syndrome"d));
	mainMenuItems.add(fileItem);
	mainMenuItems.add(helpItem);

	MainMenu mainMenu = new MainMenu(mainMenuItems);
	content.addChild(mainMenu);

	SyndromeFrame frame = new SyndromeFrame("main");
	frame.layoutWidth = FILL_PARENT;
	frame.layoutHeight = FILL_PARENT;
	content.addChild(frame);

	content.onAction = delegate(Widget source, const Action a) {
		if (a.id == SyndromeActions.FileExit) {
			window.close();
			return true;
		}
		if (a.id == SyndromeActions.FileOpenRepo) return true;
		if (a.id == SyndromeActions.FileSave) { frame.onSave(null); return true; }
		if (a.id == SyndromeActions.FileCommit) { frame.onCommit(null); return true; }
		if (a.id == SyndromeActions.HelpSetupTools) {
			runOnboarding(window);
			return true;
		}
		if (a.id == SyndromeActions.HelpAbout) {
			window.showMessageBox("About Syndrome"d, "Syndrome — Edit Markdown/AsciiDoc in GitHub static site repos.\n\nFor non-technical users. Supports Hugo, Jekyll, MkDocs, Docusaurus, Astro, Starlight, Antora, VitePress, Eleventy, and more.\n\nNamed for \"Markdown Syndrome\" and for the Down Syndrome non-profit (Memphis, TN).\n\nGitHub: https://github.com/AMDphreak/syndrome\nDocs (GitHub Pages): https://amdphreak.github.io/syndrome\n\nAGPL-3.0-or-later © AMDphreak"d);
			return true;
		}
		return false;
	};

	window.mainWidget = content;
	window.show();

	// If GitHub CLI is missing or user not logged in, show onboarding (winget install + gh auth login).
	string username;
	AuthStatus auth = checkGhAuth(username);
	if (auth == AuthStatus.noGhCli || auth == AuthStatus.notAuthenticated) {
		runOnboarding(window);
		// Refresh PATH so newly installed gh is found (user may need to restart for PATH).
		// Proceed to main loop; user can open onboarding again from Help if needed.
	}

	return Platform.instance.enterMessageLoop();
}
